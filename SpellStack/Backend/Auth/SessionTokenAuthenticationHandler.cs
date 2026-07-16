using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SpellStack.Api.Data;
using SpellStack.Api.Services;

namespace SpellStack.Api.Auth {
    public class SessionTokenAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions> {
        public const string SchemeName = "SessionToken";

        private readonly AppDbContext db;

        public SessionTokenAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            AppDbContext db)
            : base(options, logger, encoder) {
            this.db = db;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync() {
            var token = GetBearerToken();

            if (string.IsNullOrWhiteSpace(token) && Request.Path.StartsWithSegments("/hubs/multiplayer")) {
                token = Request.Query["access_token"].FirstOrDefault();
            }

            if (string.IsNullOrWhiteSpace(token)) {
                return AuthenticateResult.NoResult();
            }

            var tokenHash = SessionTokenHasher.Hash(token);
            var session = await db.UserSessions
                .Include(userSession => userSession.User)
                .FirstOrDefaultAsync(userSession =>
                    userSession.TokenHash == tokenHash &&
                    userSession.ExpiresAt > DateTime.UtcNow);

            if (session?.User == null) {
                return AuthenticateResult.Fail("Invalid or expired session token.");
            }

            var claims = new List<Claim> {
                new(ClaimTypes.NameIdentifier, session.User.Id.ToString()),
                new(ClaimTypes.Name, session.User.Username)
            };

            if (session.User.IsAdmin) {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            if (!string.IsNullOrWhiteSpace(session.User.ProfileImageUrl)) {
                claims.Add(new Claim("profileImageUrl", session.User.ProfileImageUrl));
            }

            if (!string.IsNullOrWhiteSpace(session.User.Country)) {
                claims.Add(new Claim("countryCode", session.User.Country));
            }

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            return AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name));
        }

        private string? GetBearerToken() {
            var authorization = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authorization)) return null;

            const string bearerPrefix = "Bearer ";
            if (!authorization.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase)) return null;

            return authorization[bearerPrefix.Length..].Trim();
        }
    }
}
