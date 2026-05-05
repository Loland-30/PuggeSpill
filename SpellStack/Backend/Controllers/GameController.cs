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

            var session = new GameSession {
                UserId = user.Id,
                DeckId = deckId,
                CurrentWordId = firstWord.Id,
                CurrentWord = firstWord,
                StreakCount = 0,
                FinalScore = 0,
                Lives = GetStartingLives(modifiers),
                IsActive = true
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
            } else {
                var shouldLoseLife = !modifiers.Contains("zen") &&
                    !request.ProtectLife &&
                    (!modifiers.Contains("momentum") || (request.TimeLeft ?? 0) <= 0);

                if (shouldLoseLife) session.Lives--;
                session.StreakCount = 0;
                if (session.Lives <= 0) {
                    session.IsActive = false;
                    await _context.SaveChangesAsync();
                    return Ok(new { correct, session, gameOver = true });
                }
            }

            // Neste ord
            var deck = await _context.Decks
                .Include(d => d.Words)
                .FirstOrDefaultAsync(d => d.Id == session.DeckId && d.UserId == user.Id);

            var nextWord = deck!.Words
                .OrderBy(_ => Guid.NewGuid())
                .FirstOrDefault(w => w.Id != session.CurrentWordId);

            if (nextWord != null) {
                session.CurrentWordId = nextWord.Id;
                session.CurrentWord = nextWord;
            }

            await _context.SaveChangesAsync();
            return Ok(new { correct, session, gameOver = false });
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

            session.IsActive = false;

            var isNewHighScore = session.FinalScore > session.Deck.HighScore;
            if (isNewHighScore) {
                session.Deck.HighScore = session.FinalScore;
            }

            await _context.SaveChangesAsync();
            return Ok(new { highScore = session.Deck.HighScore, isNewHighScore });
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

        private static bool IsAnswerCorrect(Word word, string answer, string direction) {
            var normalizedAnswer = Normalize(answer);
            if (direction == "translation") {
                return normalizedAnswer == Normalize(word.Original);
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
            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
            return header["Bearer ".Length..].Trim();
        }
    }

    public record StartGameRequest(string? Modifier, string[]? Modifiers);
    public record AnswerRequest(string Answer, string? Direction, int? TimeLeft, string? Modifier, string[]? Modifiers, bool ProtectLife);
    public record RushHourCompleteRequest(int BonusScore);
}
