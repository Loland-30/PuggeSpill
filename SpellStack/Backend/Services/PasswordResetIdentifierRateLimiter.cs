using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;

namespace SpellStack.Api.Services;

public interface IPasswordResetIdentifierRateLimiter {
    bool TryAcquire(string operation, string identifier);
}

public sealed class PasswordResetIdentifierRateLimiter : IPasswordResetIdentifierRateLimiter, IDisposable {
    private readonly PartitionedRateLimiter<string> limiter =
        PartitionedRateLimiter.Create<string, string>(resource => {
            var separator = resource.IndexOf(':');
            var operation = separator > 0 ? resource[..separator] : resource;
            var permitLimit = operation switch {
                "request" => 5,
                "verify" => 20,
                "complete" => 10,
                _ => 5
            };
            return RateLimitPartition.GetFixedWindowLimiter(
                resource,
                _ => new FixedWindowRateLimiterOptions {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
        });

    public bool TryAcquire(string operation, string identifier) {
        var normalizedIdentifier = identifier.Trim().ToLowerInvariant();
        var identifierHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(normalizedIdentifier)));
        using var lease = limiter.AttemptAcquire(
            $"{operation}:{identifierHash}",
            permitCount: 1);
        return lease.IsAcquired;
    }

    public void Dispose() => limiter.Dispose();
}
