using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;

namespace LexiGo.Api.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase {

        private readonly AppDbContext _context;

        public GameController(AppDbContext context) {
            _context = context;
        }

        [HttpPost("start/{deckId}")]
        public async Task<IActionResult> StartGame(int deckId, [FromBody] StartGameRequest? request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks
                .Include(d => d.Words)
                .FirstOrDefaultAsync(d => d.Id == deckId && d.UserId == user.Id);

            if (deck == null) return NotFound();
            if (!deck.Words.Any()) return BadRequest("Deck har ingen ord");

            var shuffled = deck.Words.OrderBy(_ => Guid.NewGuid()).ToList();
            var firstWord = shuffled.First();

            var modifiers = NormalizeModifiers(request?.Modifiers, request?.Modifier);
            var roundLimit = NormalizeRoundLimit(request?.RoundLimit);

            var session = new GameSession {
                UserId = user.Id,
                DeckId = deckId,
                CurrentWordId = firstWord.Id,
                CurrentWord = firstWord,
                StreakCount = 0,
                FinalScore = 0,
                Lives = GetStartingLives(modifiers),
                IsActive = true,
                RoundLimit = roundLimit,
                QuestionsAnswered = 0,
                CorrectAnswers = 0,
                WrongAnswers = 0,
                BestStreak = 0,
                ResultSaved = false,
                ModifiersJson = JsonSerializer.Serialize(modifiers)
            };

            _context.GameSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(session);
        }

        [HttpPost("answer/{id}")]
        public async Task<IActionResult> Answer(int id, [FromBody] AnswerRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var session = await _context.GameSessions
                .Include(s => s.CurrentWord)
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

            if (session == null) return NotFound();
            if (!session.IsActive) return BadRequest("Session er ikke aktiv");

            var direction = request.Direction?.ToLowerInvariant() == "translation"
                ? "translation"
                : "original";

            var modifiers = NormalizeModifiers(request.Modifiers, request.Modifier);
            var correct = IsAnswerCorrect(session.CurrentWord, request.Answer, direction);

            if (correct) {
                var nextStreak = session.StreakCount + 1;
                var timeBonus = Math.Max(0, request.TimeLeft ?? 0) * 5;
                var streakBonus = nextStreak >= 3 ? nextStreak * 25 : 0;

                var score = modifiers.Contains("zen") ? 0 : 100 + timeBonus + streakBonus;
                score = (int)Math.Round(score * GetScoreMultiplier(modifiers));

                session.FinalScore += score;
                session.StreakCount = nextStreak;
                session.CorrectAnswers++;
                session.BestStreak = Math.Max(session.BestStreak, nextStreak);
            } else {
                var shouldLoseLife = !modifiers.Contains("zen") &&
                    !request.ProtectLife &&
                    (!modifiers.Contains("momentum") || (request.TimeLeft ?? 0) <= 0);

                if (shouldLoseLife) session.Lives--;

                session.StreakCount = 0;
                session.WrongAnswers++;
            }

            session.QuestionsAnswered++;

            if (session.Lives <= 0) {
                await FinishSession(session, "gameOver");
                await _context.SaveChangesAsync();

                return Ok(new {
                    correct,
                    session,
                    gameOver = true,
                    gameComplete = false
                });
            }

            if (session.RoundLimit.HasValue && session.QuestionsAnswered >= session.RoundLimit.Value) {
                await FinishSession(session, "completed");
                await _context.SaveChangesAsync();

                return Ok(new {
                    correct,
                    session,
                    gameOver = false,
                    gameComplete = true
                });
            }

            var deck = await _context.Decks
                .Include(d => d.Words)
                .FirstOrDefaultAsync(d => d.Id == session.DeckId && d.UserId == user.Id);

            if (deck == null) return NotFound();

            var nextWord = deck.Words
                .OrderBy(_ => Guid.NewGuid())
                .FirstOrDefault(w => w.Id != session.CurrentWordId);

            if (nextWord != null) {
                session.CurrentWordId = nextWord.Id;
                session.CurrentWord = nextWord;
            }

            await _context.SaveChangesAsync();

            return Ok(new {
                correct,
                session,
                gameOver = false,
                gameComplete = false
            });
        }

        [HttpGet("state/{id}")]
        public async Task<IActionResult> GetState(int id) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var session = await _context.GameSessions
                .Include(s => s.CurrentWord)
                .Include(s => s.Deck)
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

            if (session == null) return NotFound();

            return Ok(session);
        }

        [HttpPost("end/{id}")]
        public async Task<IActionResult> EndGame(int id) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var session = await _context.GameSessions
                .Include(s => s.Deck)
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

            if (session == null) return NotFound();

            var result = await FinishSession(session, "endedByUser");
            await _context.SaveChangesAsync();

            return Ok(new {
                highScore = result.HighScore,
                isNewHighScore = result.IsNewHighScore
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] string? language, [FromQuery] int? limit) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var take = Math.Clamp(limit ?? 10, 1, 100);
            var normalizedLanguage = language?.Trim().ToLowerInvariant();

            var query = _context.GameRunResults
                .AsNoTracking()
                .Include(run => run.Deck)
                .Where(run => run.UserId == user.Id);

            if (!string.IsNullOrWhiteSpace(normalizedLanguage)) {
                query = query.Where(run => run.LanguageCode.ToLower() == normalizedLanguage);
            }

            var runs = await query
                .OrderByDescending(run => run.CompletedAt)
                .Take(take)
                .Select(run => new {
                    run.Id,
                    run.DeckId,
                    deckName = run.Deck.Name,
                    run.GameSessionId,
                    run.LanguageCode,
                    run.FinalScore,
                    run.CorrectAnswers,
                    run.WrongAnswers,
                    run.TotalAnswers,
                    run.AccuracyPercent,
                    run.BestStreak,
                    run.HighestCombo,
                    run.AverageResponseTimeSeconds,
                    run.RoundLimit,
                    run.CompletedAt,
                    run.EndReason,
                    run.ModifiersJson
                })
                .ToListAsync();

            return Ok(runs);
        }

        [HttpPost("rush-hour/{id}/complete")]
        public async Task<IActionResult> CompleteRushHour(int id, [FromBody] RushHourCompleteRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var session = await _context.GameSessions
                .Include(s => s.CurrentWord)
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

            if (session == null) return NotFound();
            if (!session.IsActive) return BadRequest("Session er ikke aktiv");

            session.FinalScore += Math.Max(0, request.BonusScore);

            await _context.SaveChangesAsync();

            return Ok(session);
        }

        private async Task<FinishSessionResult> FinishSession(GameSession session, string endReason) {
            session.IsActive = false;

            if (session.Deck == null) {
                await _context.Entry(session).Reference(s => s.Deck).LoadAsync();
            }

            var deck = session.Deck ?? throw new InvalidOperationException("Game session is missing its deck.");

            var isNewHighScore = session.FinalScore > deck.HighScore;
            if (isNewHighScore) {
                deck.HighScore = session.FinalScore;
            }

            var resultAlreadySaved = session.ResultSaved ||
                await _context.GameRunResults.AnyAsync(result => result.GameSessionId == session.Id);

            if (!resultAlreadySaved) {
                var totalAnswers = Math.Max(session.QuestionsAnswered, session.CorrectAnswers + session.WrongAnswers);
                var accuracyPercent = totalAnswers == 0
                    ? 0
                    : Math.Round(session.CorrectAnswers * 100.0 / totalAnswers, 2);

                _context.GameRunResults.Add(new GameRunResult {
                    UserId = session.UserId,
                    DeckId = session.DeckId,
                    GameSessionId = session.Id,
                    LanguageCode = GetRunLanguageCode(deck),
                    FinalScore = session.FinalScore,
                    CorrectAnswers = session.CorrectAnswers,
                    WrongAnswers = session.WrongAnswers,
                    TotalAnswers = totalAnswers,
                    AccuracyPercent = accuracyPercent,
                    BestStreak = session.BestStreak,
                    HighestCombo = session.BestStreak,
                    AverageResponseTimeSeconds = null,
                    RoundLimit = session.RoundLimit,
                    CompletedAt = DateTime.UtcNow,
                    EndReason = endReason,
                    ModifiersJson = session.ModifiersJson
                });

                session.ResultSaved = true;
            }

            return new FinishSessionResult(deck.HighScore, isNewHighScore);
        }

        private static string GetRunLanguageCode(Deck deck) {
            if (!string.IsNullOrWhiteSpace(deck.LearningLanguage)) return deck.LearningLanguage;
            if (!string.IsNullOrWhiteSpace(deck.TranslationLanguage)) return deck.TranslationLanguage;
            return deck.Language;
        }

        private static bool IsAnswerCorrect(Word word, string answer, string direction) {
            var normalizedAnswer = Normalize(answer);

            if (direction == "translation") {
                if (normalizedAnswer == Normalize(word.Original)) return true;

                if (!string.IsNullOrWhiteSpace(word.AlternativeOriginal)) {
                    var alternatives = word.AlternativeOriginal
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                    return alternatives.Any(alternative => normalizedAnswer == Normalize(alternative));
                }

                return false;
            }

            if (normalizedAnswer == Normalize(word.Translation)) return true;

            if (!string.IsNullOrWhiteSpace(word.AlternativeTranslation)) {
                var alternatives = word.AlternativeTranslation
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                return alternatives.Any(alternative => normalizedAnswer == Normalize(alternative));
            }

            return false;
        }

        private static int GetStartingLives(IReadOnlyCollection<string> modifiers) {
            if (modifiers.Contains("hardcore")) return 1;

            var lives = modifiers.Contains("zen") ? 4 : 3;
            if (modifiers.Contains("extraheart")) lives++;

            return lives;
        }

        private static double GetScoreMultiplier(IReadOnlyCollection<string> modifiers) {
            if (modifiers.Contains("zen")) return 0;

            var multiplier = 1.0;

            if (modifiers.Contains("extraheart")) multiplier *= 0.75;
            if (modifiers.Contains("hardcore")) multiplier *= 1.5;
            if (modifiers.Contains("momentum")) multiplier *= 1.25;

            return multiplier;
        }

        private static int? NormalizeRoundLimit(int? roundLimit) {
            return roundLimit switch {
                null => null,
                10 => 10,
                25 => 25,
                50 => 50,
                100 => 100,
                _ => 25
            };
        }

        private static IReadOnlyCollection<string> NormalizeModifiers(string[]? modifiers, string? legacyModifier) {
            var normalized = (modifiers ?? Array.Empty<string>())
                .Select(NormalizeModifier)
                .Where(modifier => modifier != "normal")
                .Distinct()
                .ToList();

            var normalizedLegacyModifier = NormalizeModifier(legacyModifier);
            if (normalizedLegacyModifier != "normal" && !normalized.Contains(normalizedLegacyModifier)) {
                normalized.Add(normalizedLegacyModifier);
            }

            return normalized;
        }

        private static string NormalizeModifier(string? modifier) {
            return modifier?.ToLowerInvariant() switch {
                "zen" => "zen",
                "extraheart" => "extraheart",
                "hardcore" => "hardcore",
                "momentum" => "momentum",
                _ => "normal"
            };
        }

        private static string Normalize(string value) {
            return value.Trim().ToLowerInvariant();
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

            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) {
                return null;
            }

            return header["Bearer ".Length..].Trim();
        }
    }

    public record StartGameRequest(string? Modifier, string[]? Modifiers, int? RoundLimit);

    public record AnswerRequest(
        string Answer,
        string? Direction,
        int? TimeLeft,
        string? Modifier,
        string[]? Modifiers,
        bool ProtectLife
    );

    public record RushHourCompleteRequest(int BonusScore);
    public record FinishSessionResult(int HighScore, bool IsNewHighScore);
}
