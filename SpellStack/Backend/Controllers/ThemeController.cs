using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;

namespace LexiGo.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class ThemeController : ControllerBase {
        private readonly AppDbContext _context;

        public ThemeController(AppDbContext context) {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTheme() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            return Ok(new ThemeResponse(user.ThemeJson));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateTheme([FromBody] ThemeRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            user.ThemeJson = request.ThemeJson ?? "";
            await _context.SaveChangesAsync();

            return Ok(new ThemeResponse(user.ThemeJson));
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
    }

    public record ThemeRequest(string? ThemeJson);
    public record ThemeResponse(string ThemeJson);
}
