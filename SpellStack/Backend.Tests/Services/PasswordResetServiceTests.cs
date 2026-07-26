using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Services;
using Xunit;

namespace SpellStack.Api.Tests.Services;

public class PasswordResetServiceTests {
    [Fact]
    public async Task RequestUsesGenericResultAndDoesNotCreateUnknownAccountRecord() {
        await using var context = CreateContext();
        var sender = new RecordingEmailSender();
        var service = CreateService(context, sender);

        var result = await service.RequestCode(
            "unknown@example.com",
            "127.0.0.1",
            TestContext.Current.CancellationToken);

        Assert.Equal(PasswordResetService.ResendCooldownSeconds, result.RetryAfterSeconds);
        Assert.Empty(context.PasswordResetTokens);
        Assert.Empty(sender.Messages);
    }

    [Fact]
    public async Task RequestStoresOnlyHashedCodeAndAttemptsEmailDelivery() {
        await using var context = CreateContext();
        var user = AddUser(context);
        var sender = new RecordingEmailSender();
        var service = CreateService(context, sender);

        await service.RequestCode(
            user.Email,
            "127.0.0.1",
            TestContext.Current.CancellationToken);

        var record = Assert.Single(context.PasswordResetTokens);
        var message = Assert.Single(sender.Messages);
        Assert.Equal(user.Email, message.Recipient);
        Assert.Matches(@"^\d{6}$", message.Code);
        Assert.NotEqual(message.Code, record.CodeHash);
        Assert.NotEqual(message.Code, record.CodeSalt);
        Assert.DoesNotContain(message.Code, record.CodeHash);
    }

    [Fact]
    public async Task RequestKeepsGenericResultWhenEmailDeliveryFails() {
        await using var context = CreateContext();
        var user = AddUser(context);
        var service = CreateService(context, new FailingEmailSender());

        var result = await service.RequestCode(
            user.Email,
            "127.0.0.1",
            TestContext.Current.CancellationToken);

        Assert.Equal(PasswordResetService.ResendCooldownSeconds, result.RetryAfterSeconds);
        var record = Assert.Single(context.PasswordResetTokens);
        Assert.NotNull(record.SupersededAt);
    }

    [Fact]
    public async Task NewCodeSupersedesOlderCode() {
        await using var context = CreateContext();
        var user = AddUser(context);
        var sender = new RecordingEmailSender();
        var service = CreateService(context, sender);

        await service.RequestCode(
            user.Email,
            null,
            TestContext.Current.CancellationToken);
        var first = Assert.Single(context.PasswordResetTokens);
        first.CreatedAt = DateTime.UtcNow.AddMinutes(-2);
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);

        await service.RequestCode(
            user.Email,
            null,
            TestContext.Current.CancellationToken);

        Assert.Equal(2, context.PasswordResetTokens.Count());
        Assert.NotNull(first.SupersededAt);
    }

    [Fact]
    public async Task ExpiredCodeCannotBeVerified() {
        await using var context = CreateContext();
        var user = AddUser(context);
        var sender = new RecordingEmailSender();
        var service = CreateService(context, sender);
        await service.RequestCode(
            user.Email,
            null,
            TestContext.Current.CancellationToken);
        var record = Assert.Single(context.PasswordResetTokens);
        record.ExpiresAt = DateTime.UtcNow.AddSeconds(-1);
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var result = await service.VerifyCode(
            user.Email,
            Assert.Single(sender.Messages).Code,
            TestContext.Current.CancellationToken);

        Assert.Equal(PasswordResetVerifyStatus.InvalidOrExpired, result.Status);
    }

    [Fact]
    public async Task VerificationAttemptsAreLimited() {
        await using var context = CreateContext();
        var user = AddUser(context);
        var service = CreateService(context, new RecordingEmailSender());
        await service.RequestCode(
            user.Email,
            null,
            TestContext.Current.CancellationToken);

        PasswordResetVerifyResult? result = null;
        for (var attempt = 0; attempt < PasswordResetService.MaximumVerificationAttempts; attempt++) {
            result = await service.VerifyCode(
                user.Email,
                "000000",
                TestContext.Current.CancellationToken);
        }

        Assert.Equal(PasswordResetVerifyStatus.TooManyAttempts, result!.Status);
        Assert.NotNull(Assert.Single(context.PasswordResetTokens).SupersededAt);
    }

    [Fact]
    public async Task VerifiedCodeIsSingleUseAndProducesShortLivedAuthorization() {
        await using var context = CreateContext();
        var user = AddUser(context);
        var sender = new RecordingEmailSender();
        var service = CreateService(context, sender);
        await service.RequestCode(
            user.Email,
            null,
            TestContext.Current.CancellationToken);
        var code = Assert.Single(sender.Messages).Code;

        var verified = await service.VerifyCode(
            user.Email,
            code,
            TestContext.Current.CancellationToken);
        var reused = await service.VerifyCode(
            user.Email,
            code,
            TestContext.Current.CancellationToken);

        Assert.Equal(PasswordResetVerifyStatus.Verified, verified.Status);
        Assert.False(string.IsNullOrWhiteSpace(verified.ResetToken));
        Assert.Equal(PasswordResetVerifyStatus.InvalidOrExpired, reused.Status);
        var record = Assert.Single(context.PasswordResetTokens);
        Assert.NotEqual(verified.ResetToken, record.ResetTokenHash);
        Assert.True(record.ResetTokenExpiresAt <=
            DateTime.UtcNow.AddMinutes(PasswordResetService.ResetAuthorizationMinutes + 1));
    }

    [Fact]
    public async Task CompletionUpdatesHashInvalidatesSessionsAndCannotBeReused() {
        await using var context = CreateContext();
        var user = AddUser(context);
        context.UserSessions.Add(new UserSession {
            UserId = user.Id,
            TokenHash = "existing-session",
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        });
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var sender = new RecordingEmailSender();
        var service = CreateService(context, sender);
        await service.RequestCode(
            user.Email,
            null,
            TestContext.Current.CancellationToken);
        var verified = await service.VerifyCode(
            user.Email,
            Assert.Single(sender.Messages).Code,
            TestContext.Current.CancellationToken);

        var weak = await service.Complete(
            verified.ResetToken!,
            "password123",
            TestContext.Current.CancellationToken);
        var completed = await service.Complete(
            verified.ResetToken!,
            "Long winter mornings are calm",
            TestContext.Current.CancellationToken);
        var reused = await service.Complete(
            verified.ResetToken!,
            "Another long secure passphrase",
            TestContext.Current.CancellationToken);

        Assert.Equal(PasswordResetCompleteStatus.WeakPassword, weak.Status);
        Assert.Equal(PasswordResetCompleteStatus.Completed, completed.Status);
        Assert.Equal(PasswordResetCompleteStatus.InvalidAuthorization, reused.Status);
        Assert.True(PasswordHasher.VerifyPassword(
            "Long winter mornings are calm",
            user.PasswordSalt,
            user.PasswordHash));
        Assert.Empty(context.UserSessions);
    }

    [Fact]
    public async Task ConcurrentCompletionAttemptsCannotBothSucceed() {
        var databaseName = Guid.NewGuid().ToString();
        await using var setupContext = CreateContext(databaseName);
        var user = AddUser(setupContext);
        var sender = new RecordingEmailSender();
        var setupService = CreateService(setupContext, sender);
        await setupService.RequestCode(
            user.Email,
            null,
            TestContext.Current.CancellationToken);
        var verified = await setupService.VerifyCode(
            user.Email,
            Assert.Single(sender.Messages).Code,
            TestContext.Current.CancellationToken);

        await using var firstContext = CreateContext(databaseName);
        await using var secondContext = CreateContext(databaseName);
        var firstService = CreateService(firstContext, new RecordingEmailSender());
        var secondService = CreateService(secondContext, new RecordingEmailSender());

        var results = await Task.WhenAll(
            firstService.Complete(
                verified.ResetToken!,
                "A sufficiently long passphrase one",
                TestContext.Current.CancellationToken),
            secondService.Complete(
                verified.ResetToken!,
                "A sufficiently long passphrase two",
                TestContext.Current.CancellationToken));

        Assert.Single(results, result =>
            result.Status == PasswordResetCompleteStatus.Completed);
        Assert.Single(results, result =>
            result.Status == PasswordResetCompleteStatus.InvalidAuthorization);
    }

    [Fact]
    public void IdentifierRateLimiterLimitsNormalizedEmailWithoutAffectingOtherUsers() {
        using var limiter = new PasswordResetIdentifierRateLimiter();

        for (var attempt = 0; attempt < 5; attempt++) {
            Assert.True(limiter.TryAcquire("request", " USER@example.com "));
        }

        Assert.False(limiter.TryAcquire("request", "user@EXAMPLE.com"));
        Assert.True(limiter.TryAcquire("request", "another@example.com"));
    }

    private static AppDbContext CreateContext(string? databaseName = null) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .Options);

    private static User AddUser(AppDbContext context) {
        var salt = PasswordHasher.CreateSalt();
        var user = new User {
            Email = "user@example.com",
            Username = "ResetUser",
            PasswordSalt = salt,
            PasswordHash = PasswordHasher.HashPassword("Old secure password", salt)
        };
        context.Users.Add(user);
        context.SaveChanges();
        return user;
    }

    private static PasswordResetService CreateService(
        AppDbContext context,
        IPasswordResetEmailSender sender) =>
        new(
            context,
            sender,
            new PasswordResetIdentifierRateLimiter(),
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> {
                    ["PASSWORD_RESET_HMAC_KEY"] =
                        "test-only-password-reset-key-with-enough-entropy"
                })
                .Build(),
            new TestHostEnvironment(),
            NullLogger<PasswordResetService>.Instance);

    private sealed class RecordingEmailSender : IPasswordResetEmailSender {
        public List<EmailMessage> Messages { get; } = [];

        public Task SendResetCode(
            string recipient,
            string code,
            DateTime expiresAtUtc,
            CancellationToken cancellationToken) {
            Messages.Add(new EmailMessage(recipient, code, expiresAtUtc));
            return Task.CompletedTask;
        }
    }

    private sealed class FailingEmailSender : IPasswordResetEmailSender {
        public Task SendResetCode(
            string recipient,
            string code,
            DateTime expiresAtUtc,
            CancellationToken cancellationToken) =>
            throw new HttpRequestException(
                "Mailtrap password reset delivery failed with status 503.",
                null,
                HttpStatusCode.ServiceUnavailable);
    }

    private sealed record EmailMessage(
        string Recipient,
        string Code,
        DateTime ExpiresAtUtc);

    private sealed class TestHostEnvironment : IWebHostEnvironment {
        public string ApplicationName { get; set; } = "Backend.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = "";
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
