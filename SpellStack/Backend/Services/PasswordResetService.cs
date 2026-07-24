using System.Security.Cryptography;
using System.Text;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SpellStack.Api.Data;
using SpellStack.Api.Models;

namespace SpellStack.Api.Services;

public interface IPasswordResetService {
    Task<PasswordResetRequestResult> RequestCode(
        string email,
        string? clientIp,
        CancellationToken cancellationToken);

    Task<PasswordResetVerifyResult> VerifyCode(
        string email,
        string code,
        CancellationToken cancellationToken);

    Task<PasswordResetCompleteResult> Complete(
        string resetToken,
        string newPassword,
        CancellationToken cancellationToken);
}

public sealed class PasswordResetService : IPasswordResetService {
    public const int CodeLength = 6;
    public const int CodeLifetimeMinutes = 15;
    public const int ResetAuthorizationMinutes = 10;
    public const int MaximumVerificationAttempts = 5;
    public const int ResendCooldownSeconds = 60;

    private readonly AppDbContext context;
    private readonly IPasswordResetEmailSender emailSender;
    private readonly IPasswordResetIdentifierRateLimiter identifierRateLimiter;
    private readonly ILogger<PasswordResetService> logger;
    private readonly byte[] hmacKey;

    public PasswordResetService(
        AppDbContext context,
        IPasswordResetEmailSender emailSender,
        IPasswordResetIdentifierRateLimiter identifierRateLimiter,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<PasswordResetService> logger) {
        this.context = context;
        this.emailSender = emailSender;
        this.identifierRateLimiter = identifierRateLimiter;
        this.logger = logger;

        var configuredKey = configuration["PASSWORD_RESET_HMAC_KEY"]
            ?? configuration["PasswordReset:HmacKey"];
        if (string.IsNullOrWhiteSpace(configuredKey)) {
            if (environment.IsProduction()) {
                throw new InvalidOperationException(
                    "PASSWORD_RESET_HMAC_KEY must be configured in production.");
            }

            logger.LogWarning(
                "Password reset HMAC key is not configured. Using an ephemeral development key.");
            hmacKey = RandomNumberGenerator.GetBytes(32);
        } else {
            hmacKey = SHA256.HashData(Encoding.UTF8.GetBytes(configuredKey));
        }
    }

    public async Task<PasswordResetRequestResult> RequestCode(
        string email,
        string? clientIp,
        CancellationToken cancellationToken) {
        var now = DateTime.UtcNow;
        var normalizedEmail = NormalizeEmail(email);
        if (!identifierRateLimiter.TryAcquire("request", normalizedEmail)) {
            return PasswordResetRequestResult.Accepted(ResendCooldownSeconds);
        }
        await RemoveOldRecords(now, cancellationToken);

        // Generate and hash work on every structurally valid request so unknown
        // accounts do not take an obviously different public path.
        var rawCode = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var salt = RandomNumberGenerator.GetBytes(16);
        var codeHash = HashCode(rawCode, salt);
        var user = await context.Users
            .SingleOrDefaultAsync(
                candidate => candidate.Email.ToLower() == normalizedEmail,
                cancellationToken);

        if (user == null) {
            return PasswordResetRequestResult.Accepted(ResendCooldownSeconds);
        }

        var latest = await context.PasswordResetTokens
            .Where(token => token.UserId == user.Id)
            .OrderByDescending(token => token.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (latest != null &&
            now - latest.CreatedAt < TimeSpan.FromSeconds(ResendCooldownSeconds)) {
            return PasswordResetRequestResult.Accepted(ResendCooldownSeconds);
        }

        var activeRecords = await context.PasswordResetTokens
            .Where(token =>
                token.UserId == user.Id &&
                token.SupersededAt == null &&
                token.ResetTokenUsedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var activeRecord in activeRecords) {
            activeRecord.SupersededAt = now;
            activeRecord.ConcurrencyStamp = NewConcurrencyStamp();
        }

        var record = new PasswordResetToken {
            UserId = user.Id,
            CodeHash = codeHash,
            CodeSalt = Convert.ToBase64String(salt),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(CodeLifetimeMinutes),
            RequestIpHash = HashClientIp(clientIp)
        };
        context.PasswordResetTokens.Add(record);
        await context.SaveChangesAsync(cancellationToken);

        try {
            await emailSender.SendResetCode(
                user.Email,
                rawCode,
                record.ExpiresAt,
                cancellationToken);
        } catch (Exception exception) when (
            exception is SmtpException or
            InvalidOperationException or
            FormatException) {
            record.SupersededAt = DateTime.UtcNow;
            record.ConcurrencyStamp = NewConcurrencyStamp();
            await context.SaveChangesAsync(cancellationToken);
            logger.LogError(
                exception,
                "Password reset email delivery failed for user {UserId}.",
                user.Id);
        }

        return PasswordResetRequestResult.Accepted(ResendCooldownSeconds);
    }

    public async Task<PasswordResetVerifyResult> VerifyCode(
        string email,
        string code,
        CancellationToken cancellationToken) {
        var now = DateTime.UtcNow;
        var normalizedEmail = NormalizeEmail(email);
        if (!identifierRateLimiter.TryAcquire("verify", normalizedEmail)) {
            return PasswordResetVerifyResult.TooManyAttempts();
        }
        var user = await context.Users
            .SingleOrDefaultAsync(
                candidate => candidate.Email.ToLower() == normalizedEmail,
                cancellationToken);
        if (user == null) {
            PerformDummyCodeComparison(code);
            return PasswordResetVerifyResult.Invalid();
        }

        var record = await context.PasswordResetTokens
            .Where(token =>
                token.UserId == user.Id &&
                token.SupersededAt == null &&
                token.VerifiedAt == null &&
                token.ResetTokenUsedAt == null)
            .OrderByDescending(token => token.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (record == null || record.ExpiresAt <= now) {
            return PasswordResetVerifyResult.Invalid();
        }

        if (record.AttemptCount >= MaximumVerificationAttempts) {
            return PasswordResetVerifyResult.TooManyAttempts();
        }

        record.AttemptCount++;
        var validCode = VerifyCodeHash(code, record.CodeSalt, record.CodeHash);
        if (!validCode) {
            if (record.AttemptCount >= MaximumVerificationAttempts) {
                record.SupersededAt = now;
            }
            record.ConcurrencyStamp = NewConcurrencyStamp();
            await context.SaveChangesAsync(cancellationToken);
            return record.AttemptCount >= MaximumVerificationAttempts
                ? PasswordResetVerifyResult.TooManyAttempts()
                : PasswordResetVerifyResult.Invalid();
        }

        var rawResetToken = CreateOpaqueToken();
        record.VerifiedAt = now;
        record.ResetTokenHash = HashOpaqueToken(rawResetToken);
        record.ResetTokenExpiresAt = now.AddMinutes(ResetAuthorizationMinutes);
        record.ConcurrencyStamp = NewConcurrencyStamp();
        await context.SaveChangesAsync(cancellationToken);

        return PasswordResetVerifyResult.Verified(rawResetToken);
    }

    public async Task<PasswordResetCompleteResult> Complete(
        string resetToken,
        string newPassword,
        CancellationToken cancellationToken) {
        if (!identifierRateLimiter.TryAcquire("complete", resetToken)) {
            return PasswordResetCompleteResult.RateLimited();
        }
        var tokenHash = HashOpaqueToken(resetToken);
        var now = DateTime.UtcNow;
        var record = await context.PasswordResetTokens
            .Include(token => token.User)
            .SingleOrDefaultAsync(token =>
                token.ResetTokenHash == tokenHash &&
                token.VerifiedAt != null &&
                token.SupersededAt == null &&
                token.ResetTokenUsedAt == null &&
                token.ResetTokenExpiresAt > now,
                cancellationToken);
        if (record == null) {
            return PasswordResetCompleteResult.InvalidAuthorization();
        }

        var policy = PasswordPolicy.Validate(
            newPassword,
            record.User.Email,
            record.User.Username);
        if (!policy.IsValid) {
            return PasswordResetCompleteResult.WeakPassword(policy.Error!);
        }

        IDbContextTransaction? transaction = null;
        try {
            if (context.Database.IsRelational()) {
                transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            }

            var salt = PasswordHasher.CreateSalt();
            record.User.PasswordSalt = salt;
            record.User.PasswordHash = PasswordHasher.HashPassword(newPassword, salt);
            record.ResetTokenUsedAt = now;
            record.SupersededAt = now;
            record.ConcurrencyStamp = NewConcurrencyStamp();

            var remainingRecords = await context.PasswordResetTokens
                .Where(token =>
                    token.UserId == record.UserId &&
                    token.Id != record.Id &&
                    token.SupersededAt == null)
                .ToListAsync(cancellationToken);
            foreach (var remainingRecord in remainingRecords) {
                remainingRecord.SupersededAt = now;
                remainingRecord.ConcurrencyStamp = NewConcurrencyStamp();
            }

            var sessions = await context.UserSessions
                .Where(session => session.UserId == record.UserId)
                .ToListAsync(cancellationToken);
            context.UserSessions.RemoveRange(sessions);

            await context.SaveChangesAsync(cancellationToken);
            if (transaction != null) {
                await transaction.CommitAsync(cancellationToken);
            }
            return PasswordResetCompleteResult.Completed();
        } catch (DbUpdateConcurrencyException) {
            if (transaction != null) {
                await transaction.RollbackAsync(cancellationToken);
            }
            return PasswordResetCompleteResult.InvalidAuthorization();
        } finally {
            if (transaction != null) await transaction.DisposeAsync();
        }
    }

    private async Task RemoveOldRecords(
        DateTime now,
        CancellationToken cancellationToken) {
        var cutoff = now.AddDays(-7);
        var oldRecords = await context.PasswordResetTokens
            .Where(token =>
                token.CreatedAt < cutoff ||
                token.ResetTokenUsedAt < cutoff ||
                token.SupersededAt < cutoff)
            .Take(100)
            .ToListAsync(cancellationToken);
        if (oldRecords.Count == 0) return;

        context.PasswordResetTokens.RemoveRange(oldRecords);
        await context.SaveChangesAsync(cancellationToken);
    }

    private string HashCode(string code, byte[] salt) {
        using var hmac = new HMACSHA256(hmacKey);
        var codeBytes = Encoding.UTF8.GetBytes(code);
        var input = new byte[salt.Length + codeBytes.Length];
        Buffer.BlockCopy(salt, 0, input, 0, salt.Length);
        Buffer.BlockCopy(codeBytes, 0, input, salt.Length, codeBytes.Length);
        return Convert.ToBase64String(hmac.ComputeHash(input));
    }

    private bool VerifyCodeHash(string code, string salt, string expectedHash) {
        try {
            var saltBytes = Convert.FromBase64String(salt);
            var actual = Convert.FromBase64String(HashCode(code.Trim(), saltBytes));
            var expected = Convert.FromBase64String(expectedHash);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        } catch (FormatException) {
            return false;
        }
    }

    private void PerformDummyCodeComparison(string code) {
        var salt = RandomNumberGenerator.GetBytes(16);
        _ = HashCode(code, salt);
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    private static string CreateOpaqueToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

    private static string HashOpaqueToken(string token) =>
        Convert.ToBase64String(
            SHA256.HashData(Encoding.UTF8.GetBytes(token.Trim())));

    private static string? HashClientIp(string? clientIp) =>
        string.IsNullOrWhiteSpace(clientIp)
            ? null
            : Convert.ToBase64String(
                SHA256.HashData(Encoding.UTF8.GetBytes(clientIp)));

    private static string NewConcurrencyStamp() => Guid.NewGuid().ToString("N");
}

public sealed record PasswordResetRequestResult(int RetryAfterSeconds) {
    public static PasswordResetRequestResult Accepted(int retryAfterSeconds) =>
        new(retryAfterSeconds);
}

public enum PasswordResetVerifyStatus {
    Verified,
    InvalidOrExpired,
    TooManyAttempts
}

public sealed record PasswordResetVerifyResult(
    PasswordResetVerifyStatus Status,
    string? ResetToken) {
    public static PasswordResetVerifyResult Verified(string resetToken) =>
        new(PasswordResetVerifyStatus.Verified, resetToken);
    public static PasswordResetVerifyResult Invalid() =>
        new(PasswordResetVerifyStatus.InvalidOrExpired, null);
    public static PasswordResetVerifyResult TooManyAttempts() =>
        new(PasswordResetVerifyStatus.TooManyAttempts, null);
}

public enum PasswordResetCompleteStatus {
    Completed,
    InvalidAuthorization,
    WeakPassword,
    RateLimited
}

public sealed record PasswordResetCompleteResult(
    PasswordResetCompleteStatus Status,
    string? Error) {
    public static PasswordResetCompleteResult Completed() =>
        new(PasswordResetCompleteStatus.Completed, null);
    public static PasswordResetCompleteResult InvalidAuthorization() =>
        new(PasswordResetCompleteStatus.InvalidAuthorization, null);
    public static PasswordResetCompleteResult WeakPassword(string error) =>
        new(PasswordResetCompleteStatus.WeakPassword, error);
    public static PasswordResetCompleteResult RateLimited() =>
        new(PasswordResetCompleteStatus.RateLimited, null);
}
