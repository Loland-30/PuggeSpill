using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;

namespace LexiGo.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context) {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request) {
            var email = request.Email.Trim().ToLowerInvariant();
            var username = request.Username.Trim();

            if (username.Length < 2) return BadRequest("Username er for kort");
            if (request.Password.Length < 6) return BadRequest("Passord må være minst 6 tegn");

            var exists = await _context.Users.AnyAsync(u =>
                u.Email.ToLower() == email || u.Username.ToLower() == username.ToLower());

            if (exists) return Conflict("Bruker finnes allerede");

            var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
            var user = new User {
                Username = username,
                Email = email,
                PasswordSalt = salt,
                PasswordHash = HashPassword(request.Password, salt),
                FavoriteLanguage = request.FavoriteLanguage?.Trim() ?? "Spanish"
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

            if (user == null || HashPassword(request.Password, user.PasswordSalt) != user.PasswordHash) {
                return Unauthorized("Feil e-post eller passord");
            }

            var token = await CreateSession(user);
            return Ok(ToAuthResponse(user, token));
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

            var sessions = _context.UserSessions.Where(s => s.Token == token);
            _context.UserSessions.RemoveRange(sessions);
            await _context.SaveChangesAsync();

            return Ok();
        }

        private async Task<string> CreateSession(User user) {
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            var session = new UserSession {
                UserId = user.Id,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();

            return token;
        }

        private async Task<User?> GetCurrentUser() {
            var token = GetBearerToken();
            if (token == null) return null;

            var session = await _context.UserSessions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Token == token && s.ExpiresAt > DateTime.UtcNow);

            return session?.User;
        }

        private string? GetBearerToken() {
            var header = Request.Headers.Authorization.ToString();
            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
            return header["Bearer ".Length..].Trim();
        }

        private static string HashPassword(string password, string salt) {
            var saltBytes = Convert.FromBase64String(salt);
            var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
                password,
                saltBytes,
                100_000,
                HashAlgorithmName.SHA256,
                32
            );
            return Convert.ToBase64String(hashBytes);
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
                user.CreatedAt
            );
        }
    }

    public record RegisterRequest(string Username, string Email, string Password, string? FavoriteLanguage);
    public record LoginRequest(string Email, string Password);
    public record AuthResponse(string Token, UserResponse User);
    public record UserResponse(int Id, string Username, string Email, string FavoriteLanguage, DateTime CreatedAt);
}
