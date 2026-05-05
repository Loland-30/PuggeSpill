using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;

namespace LexiGo.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase {
        private readonly AppDbContext _context;

        public ProfileController(AppDbContext context) {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> Summary() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deckIds = await _context.Decks
                .Where(d => d.UserId == user.Id)
                .Select(d => d.Id)
                .ToListAsync();
            var runsPlayed = await _context.GameSessions.CountAsync(s => deckIds.Contains(s.DeckId));
            var longestStreak = await _context.GameSessions.AnyAsync(s => deckIds.Contains(s.DeckId))
                ? await _context.GameSessions
                    .Where(s => deckIds.Contains(s.DeckId))
                    .MaxAsync(s => s.StreakCount)
                : 0;
            var wordsLearned = await _context.Words.CountAsync(w => deckIds.Contains(w.DeckId));

            return Ok(new ProfileSummaryResponse(runsPlayed, longestStreak, wordsLearned));
        }

        [HttpGet("languages")]
        public async Task<IActionResult> Languages() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var decks = await _context.Decks
                .Include(d => d.Words)
                .Where(d => d.UserId == user.Id)
                .ToListAsync();
            var languageDeckIds = decks.Select(d => d.Id).ToList();
            var sessions = await _context.GameSessions
                .Where(s => s.UserId == user.Id || languageDeckIds.Contains(s.DeckId))
                .ToListAsync();

            var stats = decks
                .GroupBy(d => string.IsNullOrWhiteSpace(d.LearningLanguage)
                    ? string.IsNullOrWhiteSpace(d.TranslationLanguage) ? d.Language : d.TranslationLanguage
                    : d.LearningLanguage)
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .Select(group => {
                    var deckIds = group.Select(d => d.Id).ToHashSet();
                    var languageSessions = sessions.Where(s => deckIds.Contains(s.DeckId)).ToList();

                    return new LanguageStatsResponse(
                        group.Key,
                        languageSessions.Count,
                        languageSessions.Count == 0 ? 0 : languageSessions.Max(s => s.StreakCount),
                        group.SelectMany(d => d.Words).Select(w => w.Id).Distinct().Count()
                    );
                })
                .OrderBy(stat => stat.LanguageCode)
                .ToList();

            return Ok(stats);
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

    public record ProfileSummaryResponse(int RunsPlayed, int LongestStreak, int WordsLearned);
    public record LanguageStatsResponse(string LanguageCode, int RunsPlayed, int LongestStreak, int WordsLearned);
}
