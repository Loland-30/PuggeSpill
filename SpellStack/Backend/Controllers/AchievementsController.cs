using LexiGo.Api.Data;
using LexiGo.Api.Models;
using LexiGo.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LexiGo.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class AchievementsController : ControllerBase {
        private readonly AppDbContext _context;
        private readonly AchievementService _achievementService;

        public AchievementsController(AppDbContext context, AchievementService achievementService) {
            _context = context;
            _achievementService = achievementService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAchievements() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var achievements = await _achievementService.GetAchievementsForUser(user.Id);

            return Ok(new {
                achievements,
                newlyUnlockedAchievements = Array.Empty<AchievementUnlockResponse>()
            });
        }

        [HttpPost("check")]
        public async Task<IActionResult> CheckForUnlocks() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            return Ok(await _achievementService.UnlockNewAchievements(user.Id));
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
}
