using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Services;

namespace SpellStack.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase {
        private readonly AppDbContext _context;
        private readonly IPasswordResetService _passwordResetService;

        public AuthController(
            AppDbContext context,
            IPasswordResetService passwordResetService) {
            _context = context;
            _passwordResetService = passwordResetService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request) {
            var email = request.Email.Trim().ToLowerInvariant();
            var username = request.Username.Trim();
            if (!CountryCodes.TryNormalize(request.Country, out var country)) {
                return BadRequest("Select a valid country.");
            }

            if (username.Length < 2) return BadRequest("Username er for kort");
            if (request.Password.Length < 6) return BadRequest("Passord må være minst 6 tegn");

            var exists = await _context.Users.AnyAsync(u =>
                u.Email.ToLower() == email || u.Username.ToLower() == username.ToLower());

            if (exists) return Conflict("Bruker finnes allerede");

            var salt = PasswordHasher.CreateSalt();
            var user = new User {
                Username = username,
                Email = email,
                PasswordSalt = salt,
                PasswordHash = PasswordHasher.HashPassword(request.Password, salt),
                FavoriteLanguage = request.FavoriteLanguage?.Trim() ?? "Spanish",
                Country = country
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = await CreateSession(user);
            return Ok(ToAuthResponse(user, token));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request) {
            var email = request.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordSalt, user.PasswordHash)) {
                return Unauthorized("Feil e-post eller passord");
            }

            var token = await CreateSession(user);
            return Ok(ToAuthResponse(user, token));
        }

        [HttpPost("password-reset/request")]
        [EnableRateLimiting("password-reset-request")]
        public async Task<IActionResult> RequestPasswordReset(
            [FromBody] PasswordResetRequest request,
            CancellationToken cancellationToken) {
            if (!IsStructurallyValidEmail(request.Email)) {
                return BadRequest(new { message = "Enter a valid email address." });
            }

            var result = await _passwordResetService.RequestCode(
                request.Email,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                cancellationToken);

            return Accepted(new {
                message = "If an account exists for this email, a reset code has been sent.",
                retryAfterSeconds = result.RetryAfterSeconds
            });
        }

        [HttpPost("password-reset/verify")]
        [EnableRateLimiting("password-reset-verify")]
        public async Task<IActionResult> VerifyPasswordReset(
            [FromBody] PasswordResetVerifyRequest request,
            CancellationToken cancellationToken) {
            if (!IsStructurallyValidEmail(request.Email) ||
                request.Code?.Trim().Length != PasswordResetService.CodeLength ||
                !request.Code.Trim().All(char.IsDigit)) {
                return BadRequest(new {
                    message = "The code is invalid or expired."
                });
            }

            var result = await _passwordResetService.VerifyCode(
                request.Email,
                request.Code.Trim(),
                cancellationToken);

            return result.Status switch {
                PasswordResetVerifyStatus.Verified => Ok(new {
                    resetToken = result.ResetToken
                }),
                PasswordResetVerifyStatus.TooManyAttempts =>
                    StatusCode(StatusCodes.Status429TooManyRequests, new {
                        message = "Too many attempts. Request a new code."
                    }),
                _ => BadRequest(new {
                    message = "The code is invalid or expired."
                })
            };
        }

        [HttpPost("password-reset/complete")]
        [EnableRateLimiting("password-reset-complete")]
        public async Task<IActionResult> CompletePasswordReset(
            [FromBody] PasswordResetCompleteRequest request,
            CancellationToken cancellationToken) {
            if (string.IsNullOrWhiteSpace(request.ResetToken)) {
                return BadRequest(new {
                    message = "Your reset authorization is invalid or expired."
                });
            }

            var result = await _passwordResetService.Complete(
                request.ResetToken,
                request.NewPassword ?? "",
                cancellationToken);

            return result.Status switch {
                PasswordResetCompleteStatus.Completed => Ok(new {
                    message = "Password updated"
                }),
                PasswordResetCompleteStatus.WeakPassword => BadRequest(new {
                    message = result.Error
                }),
                PasswordResetCompleteStatus.RateLimited =>
                    StatusCode(StatusCodes.Status429TooManyRequests, new {
                        message = "Too many attempts. Please try again later."
                    }),
                _ => BadRequest(new {
                    message = "Your reset authorization is invalid or expired."
                })
            };
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            return Ok(ToUserResponse(user));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout() {
            var token = GetBearerToken();
            if (token == null) return Ok();

            var tokenHash = SessionTokenHasher.Hash(token);
            var sessions = _context.UserSessions.Where(s => s.TokenHash == tokenHash);
            _context.UserSessions.RemoveRange(sessions);
            await _context.SaveChangesAsync();

            return Ok();
        }

        private async Task<string> CreateSession(User user) {
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            var session = new UserSession {
                UserId = user.Id,
                TokenHash = SessionTokenHasher.Hash(token),
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();

            return token;
        }

        private async Task<User?> GetCurrentUser() {
            var token = GetBearerToken();
            if (token == null) return null;

            var tokenHash = SessionTokenHasher.Hash(token);
            var session = await _context.UserSessions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.TokenHash == tokenHash && s.ExpiresAt > DateTime.UtcNow);

            return session?.User;
        }

        private string? GetBearerToken() {
            var header = Request.Headers.Authorization.ToString();
            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
            return header["Bearer ".Length..].Trim();
        }

        private static bool IsStructurallyValidEmail(string? email) {
            if (string.IsNullOrWhiteSpace(email) || email.Length > 320) return false;
            try {
                var address = new System.Net.Mail.MailAddress(email.Trim());
                return string.Equals(
                    address.Address,
                    email.Trim(),
                    StringComparison.OrdinalIgnoreCase);
            } catch (FormatException) {
                return false;
            }
        }

        private static AuthResponse ToAuthResponse(User user, string token) {
            return new AuthResponse(token, ToUserResponse(user));
        }

        private static UserResponse ToUserResponse(User user) {
            return new UserResponse(
                user.Id,
                user.Username,
                user.Email,
                user.FavoriteLanguage,
                user.Country,
                user.CreatedAt,
                user.ProfileImageUrl,
                user.CustomLoginSplashSoundUrl,
                user.CustomMainMenuMusicUrl,
                user.IsAdmin
            );
        }

    }

    public record RegisterRequest(string Username, string Email, string Password, string? FavoriteLanguage, string? Country);
    public record LoginRequest(string Email, string Password);
    public record PasswordResetRequest(string Email);
    public record PasswordResetVerifyRequest(string Email, string Code);
    public record PasswordResetCompleteRequest(string ResetToken, string NewPassword);
    public record AuthResponse(string Token, UserResponse User);
    public record UserResponse(
        int Id,
        string Username,
        string Email,
        string FavoriteLanguage,
        string? Country,
        DateTime CreatedAt,
        string? ProfileImageUrl,
        string? CustomLoginSplashSoundUrl,
        string? CustomMainMenuMusicUrl,
        bool IsAdmin
    );
}
