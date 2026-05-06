using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;

namespace LexiGo.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class AchievementsController : ControllerBase {
        private readonly AppDbContext _context;

        private static readonly AchievementDefinition[] Definitions = [
            new("mastery_first_deck", "Mastery", "First Deck Cleared", "Create your first deck.", stats => stats.DeckCount >= 1),
            new("mastery_100_words", "Mastery", "100 Words Learned", "Add 100 words across your decks.", stats => stats.WordCount >= 100),
            new("mastery_perfect_practice", "Mastery", "Perfect Practice", "Reach a score of 1,000 on any deck.", stats => stats.HighScore >= 1000),
            new("streak_10", "Streaks", "10 Answer Streak", "Reach a 10 answer streak.", stats => stats.LongestStreak >= 10),
            new("streak_flawless_round", "Streaks", "Flawless Round", "Reach a 20 answer streak.", stats => stats.LongestStreak >= 20),
            new("streak_daily_spark", "Streaks", "Daily Spark", "Play 3 runs.", stats => stats.RunsPlayed >= 3),
            new("speed_under_pressure", "Speed", "Under Pressure", "Reach a score of 500.", stats => stats.HighScore >= 500),
            new("speed_lightning_recall", "Speed", "Lightning Recall", "Reach a score of 1,500.", stats => stats.HighScore >= 1500),
            new("speed_fast_finish", "Speed", "Fast Finish", "Play 10 runs.", stats => stats.RunsPlayed >= 10),
            new("language_bilingual_start", "Languages", "Bilingual Start", "Practice your first learning language.", stats => stats.LanguageCount >= 1),
            new("language_three_languages", "Languages", "Three Languages", "Practice 3 learning languages.", stats => stats.LanguageCount >= 3),
            new("language_specialist", "Languages", "Language Specialist", "Add 50 words in one language.", stats => stats.MaxWordsInLanguage >= 50),
            new("challenge_rush_initiate", "Challenges", "Rush Initiate", "Reach a score of 1,000.", stats => stats.HighScore >= 1000),
            new("challenge_trial_runner", "Challenges", "Trial Runner", "Play 5 runs.", stats => stats.RunsPlayed >= 5),
            new("challenge_hardcore_victory", "Challenges", "Hardcore Victory", "Reach a score of 2,000.", stats => stats.HighScore >= 2000)
        ];

        public AchievementsController(AppDbContext context) {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAchievements() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var stats = await GetAchievementStats(user.Id);
            var unlocked = await _context.UserAchievements
                .Where(achievement => achievement.UserId == user.Id)
                .ToListAsync();
            var unlockedIds = unlocked.Select(achievement => achievement.AchievementId).ToHashSet();
            var newlyUnlocked = Definitions
                .Where(definition => !unlockedIds.Contains(definition.Id) && definition.IsUnlocked(stats))
                .Select(definition => new UserAchievement {
                    UserId = user.Id,
                    AchievementId = definition.Id
                })
                .ToList();

            if (newlyUnlocked.Count > 0) {
                _context.UserAchievements.AddRange(newlyUnlocked);
                await _context.SaveChangesAsync();
                unlocked.AddRange(newlyUnlocked);
            }

            var unlockedById = unlocked.ToDictionary(
                achievement => achievement.AchievementId,
                achievement => achievement.UnlockedAt
            );

            return Ok(Definitions.Select(definition => new AchievementResponse(
                definition.Id,
                definition.Category,
                definition.Name,
                definition.Description,
                unlockedById.ContainsKey(definition.Id),
                unlockedById.GetValueOrDefault(definition.Id)
            )));
        }

        private async Task<AchievementStats> GetAchievementStats(int userId) {
            var decks = await _context.Decks
                .Include(deck => deck.Words)
                .Where(deck => deck.UserId == userId)
                .ToListAsync();
            var deckIds = decks.Select(deck => deck.Id).ToHashSet();
            var sessions = await _context.GameSessions
                .Where(session => session.UserId == userId || deckIds.Contains(session.DeckId))
                .ToListAsync();
            var wordsByLanguage = decks
                .GroupBy(deck => string.IsNullOrWhiteSpace(deck.LearningLanguage)
                    ? string.IsNullOrWhiteSpace(deck.TranslationLanguage) ? deck.Language : deck.TranslationLanguage
                    : deck.LearningLanguage)
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .Select(group => group.SelectMany(deck => deck.Words).Select(word => word.Id).Distinct().Count())
                .ToList();

            return new AchievementStats(
                decks.Count,
                decks.SelectMany(deck => deck.Words).Select(word => word.Id).Distinct().Count(),
                sessions.Count,
                sessions.Count == 0 ? 0 : sessions.Max(session => session.StreakCount),
                sessions.Count == 0 ? 0 : sessions.Max(session => session.FinalScore),
                wordsByLanguage.Count,
                wordsByLanguage.Count == 0 ? 0 : wordsByLanguage.Max()
            );
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

    public record AchievementResponse(
        string Id,
        string Category,
        string Name,
        string Description,
        bool Unlocked,
        DateTime? UnlockedAt
    );

    public record AchievementStats(
        int DeckCount,
        int WordCount,
        int RunsPlayed,
        int LongestStreak,
        int HighScore,
        int LanguageCount,
        int MaxWordsInLanguage
    );

    public record AchievementDefinition(
        string Id,
        string Category,
        string Name,
        string Description,
        Func<AchievementStats, bool> IsUnlocked
    );
}
