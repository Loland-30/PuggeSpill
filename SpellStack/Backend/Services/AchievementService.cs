using LexiGo.Api.Data;
using LexiGo.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace LexiGo.Api.Services {
    public class AchievementService {
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
            new("challenge_hardcore_victory", "Challenges", "Hardcore Victory", "Reach a score of 2,000.", stats => stats.HighScore >= 2000),
            new("challenge_hardcore_first_run", "Challenges", "Hardcore Initiate", "Complete one run with Hardcore active.", stats => stats.HardcoreRunsPlayed >= 1),
            new("challenge_hardcore_10000", "Challenges", "Hardcore Master", "Reach a score of at least 10,000 with Hardcore active.", stats => stats.HardcoreHighScore >= 10000)
        ];

        private readonly AppDbContext _context;

        public AchievementService(AppDbContext context) {
            _context = context;
        }

        public async Task<IReadOnlyList<AchievementResponse>> GetAchievementsForUser(int userId) {
            var unlocked = await _context.UserAchievements
                .AsNoTracking()
                .Where(achievement => achievement.UserId == userId)
                .ToListAsync();
            var unlockedById = unlocked.ToDictionary(
                achievement => achievement.AchievementId,
                achievement => achievement.UnlockedAt
            );

            return Definitions.Select(definition => new AchievementResponse(
                definition.Id,
                definition.Category,
                definition.Name,
                definition.Description,
                unlockedById.ContainsKey(definition.Id),
                unlockedById.GetValueOrDefault(definition.Id)
            )).ToList();
        }

        public async Task<IReadOnlyList<AchievementUnlockResponse>> UnlockNewAchievements(int userId) {
            var stats = await GetAchievementStats(userId);
            var unlockedIds = await _context.UserAchievements
                .AsNoTracking()
                .Where(achievement => achievement.UserId == userId)
                .Select(achievement => achievement.AchievementId)
                .ToListAsync();
            var unlockedIdSet = unlockedIds.ToHashSet();
            var unlockedAt = DateTime.UtcNow;
            var newlyUnlockedDefinitions = Definitions
                .Where(definition => !unlockedIdSet.Contains(definition.Id) && definition.IsUnlocked(stats))
                .ToList();

            if (newlyUnlockedDefinitions.Count == 0) return [];

            var newlyUnlocked = newlyUnlockedDefinitions.Select(definition => new UserAchievement {
                UserId = userId,
                AchievementId = definition.Id,
                UnlockedAt = unlockedAt
            }).ToList();

            _context.UserAchievements.AddRange(newlyUnlocked);
            await _context.SaveChangesAsync();

            return newlyUnlockedDefinitions.Select(definition => new AchievementUnlockResponse(
                definition.Id,
                definition.Category,
                definition.Name,
                definition.Description,
                unlockedAt
            )).ToList();
        }

        private async Task<AchievementStats> GetAchievementStats(int userId) {
            var decks = await _context.Decks
                .Include(deck => deck.Words)
                .Where(deck => deck.UserId == userId)
                .ToListAsync();
            var runs = await _context.GameRunResults
                .AsNoTracking()
                .Where(run => run.UserId == userId)
                .ToListAsync();
            var wordsByLanguage = decks
                .GroupBy(deck => string.IsNullOrWhiteSpace(deck.LearningLanguage)
                    ? string.IsNullOrWhiteSpace(deck.TranslationLanguage) ? deck.Language : deck.TranslationLanguage
                    : deck.LearningLanguage)
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .Select(group => group.SelectMany(deck => deck.Words).Select(word => word.Id).Distinct().Count())
                .ToList();
            var hardcoreRuns = runs
                .Where(run => HasModifier(run.ModifiersJson, "hardcore"))
                .ToList();

            return new AchievementStats(
                decks.Count,
                decks.SelectMany(deck => deck.Words).Select(word => word.Id).Distinct().Count(),
                runs.Count,
                runs.Count == 0 ? 0 : runs.Max(run => Math.Max(run.BestStreak, run.HighestCombo)),
                runs.Count == 0 ? 0 : runs.Max(run => run.FinalScore),
                wordsByLanguage.Count,
                wordsByLanguage.Count == 0 ? 0 : wordsByLanguage.Max(),
                hardcoreRuns.Count,
                hardcoreRuns.Count == 0 ? 0 : hardcoreRuns.Max(run => run.FinalScore)
            );
        }

        private static bool HasModifier(string modifiersJson, string modifier) {
            if (string.IsNullOrWhiteSpace(modifiersJson)) return false;

            try {
                var modifiers = JsonSerializer.Deserialize<string[]>(modifiersJson) ?? [];
                return modifiers.Any(value =>
                    string.Equals(value, modifier, StringComparison.OrdinalIgnoreCase));
            } catch (JsonException) {
                return string.Equals(
                    modifiersJson.Trim().Trim('"'),
                    modifier,
                    StringComparison.OrdinalIgnoreCase
                );
            }
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

    public record AchievementUnlockResponse(
        string Id,
        string Category,
        string Name,
        string Description,
        DateTime UnlockedAt
    );

    public record AchievementStats(
        int DeckCount,
        int WordCount,
        int RunsPlayed,
        int LongestStreak,
        int HighScore,
        int LanguageCount,
        int MaxWordsInLanguage,
        int HardcoreRunsPlayed,
        int HardcoreHighScore
    );

    public record AchievementDefinition(
        string Id,
        string Category,
        string Name,
        string Description,
        Func<AchievementStats, bool> IsUnlocked
    );
}
