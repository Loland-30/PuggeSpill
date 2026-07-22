using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Services;

namespace SpellStack.Api.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class DeckController : ControllerBase {

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public DeckController(AppDbContext context, IWebHostEnvironment environment) {
            _context = context;
            _environment = environment;
        }

        [HttpGet]
        public async Task<IActionResult> GetDecks() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            if (_environment.IsDevelopment()) {
                await ClaimLocalDecks(user.Id);
            }

            var decks = await _context.Decks
                .Include(d => d.Words)
                .Where(d => d.UserId == user.Id)
                .ToListAsync();
            return Ok(decks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeck(int id) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks
                .Include(d => d.Words)
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == user.Id);
            if (deck == null) return NotFound();
            return Ok(deck);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDeck([FromBody] CreateDeckRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = new Deck {
                UserId = user.Id,
                Name = request.Name,
                Language = request.Language,
                TranslationLanguage = request.TranslationLanguage ?? "no",
                LearningLanguage = request.LearningLanguage ?? request.TranslationLanguage ?? "no",
                Description = request.Description ?? ""
            };
            _context.Decks.Add(deck);
            await _context.SaveChangesAsync();
            return Ok(deck);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDeck(int id, [FromBody] CreateDeckRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks.FirstOrDefaultAsync(d => d.Id == id && d.UserId == user.Id);
            if (deck == null) return NotFound();

            var trialContentChanged = deck.Language != request.Language ||
                deck.TranslationLanguage != (request.TranslationLanguage ?? "no") ||
                deck.LearningLanguage != (request.LearningLanguage ?? request.TranslationLanguage ?? "no");

            deck.Name = request.Name;
            deck.Language = request.Language;
            deck.TranslationLanguage = request.TranslationLanguage ?? "no";
            deck.LearningLanguage = request.LearningLanguage ?? request.TranslationLanguage ?? "no";
            deck.Description = request.Description ?? "";
            if (trialContentChanged) deck.ContentRevision++;
            await _context.SaveChangesAsync();
            return Ok(deck);
        }

        [HttpPut("{id}/content")]
        public async Task<IActionResult> UpdateDeckContent(int id, [FromBody] UpdateDeckContentRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();
            if (request.Words == null) return BadRequest("Words are required.");

            var deck = await _context.Decks
                .Include(d => d.Words)
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == user.Id);
            if (deck == null) return NotFound();

            var suppliedIds = request.Words
                .Where(word => word.Id.HasValue)
                .Select(word => word.Id!.Value)
                .ToList();
            if (suppliedIds.Any(wordId => wordId <= 0) || suppliedIds.Count != suppliedIds.Distinct().Count()) {
                return BadRequest("Word IDs must be unique valid IDs.");
            }

            var persistedWordsById = deck.Words.ToDictionary(word => word.Id);
            if (suppliedIds.Any(wordId => !persistedWordsById.ContainsKey(wordId))) {
                return BadRequest("One or more word IDs do not belong to this deck.");
            }

            if (request.Words.Any(word => string.IsNullOrWhiteSpace(word.Original) || string.IsNullOrWhiteSpace(word.Translation))) {
                return BadRequest("Every word requires an original and translation.");
            }

            var trialContentChanged = HasTrialRelevantChanges(deck, request);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try {
                deck.Name = request.Name.Trim();
                deck.Description = request.Description?.Trim() ?? "";
                deck.Language = request.Language.Trim();
                deck.TranslationLanguage = request.TranslationLanguage.Trim();
                deck.LearningLanguage = request.LearningLanguage.Trim();

                foreach (var submittedWord in request.Words) {
                    if (submittedWord.Id.HasValue) {
                        ApplyWordChanges(persistedWordsById[submittedWord.Id.Value], submittedWord);
                    } else {
                        var newWord = new Word { DeckId = deck.Id };
                        ApplyWordChanges(newWord, submittedWord);
                        deck.Words.Add(newWord);
                    }
                }

                var submittedIdSet = suppliedIds.ToHashSet();
                var removedWords = deck.Words
                    .Where(word => word.Id > 0 && !submittedIdSet.Contains(word.Id))
                    .ToList();
                _context.Words.RemoveRange(removedWords);

                if (trialContentChanged) deck.ContentRevision++;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var updatedDeck = await _context.Decks
                    .AsNoTracking()
                    .Include(item => item.Words)
                    .FirstAsync(item => item.Id == deck.Id && item.UserId == user.Id);
                return Ok(updatedDeck);
            } catch {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpPost("{id}/trial-result")]
        public async Task<IActionResult> CompleteTrial(int id, [FromBody] TrialResultRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks
                .Include(d => d.Words)
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == user.Id);
            if (deck == null) return NotFound();

            var wordCount = deck.Words.Count;
            if (wordCount < TrialRules.MinimumDeckWordCount) {
                return BadRequest($"A Trial requires at least {TrialRules.MinimumDeckWordCount} words.");
            }
            if (request.TotalQuestions != wordCount) return BadRequest("Trial question count no longer matches this deck.");
            if (request.CorrectAnswers < 0 || request.CorrectAnswers > request.TotalQuestions) {
                return BadRequest("Correct answer count is invalid.");
            }

            var percentage = Math.Round(request.CorrectAnswers * 100d / request.TotalQuestions, 2);
            var requirements = TrialRules.GetRequirements(wordCount);
            var earnedStars = TrialRules.CalculateEarnedStars(request.CorrectAnswers, wordCount);
            var hasCurrentResult = deck.TrialResultRevision == deck.ContentRevision;
            var currentBestStars = hasCurrentResult
                ? Math.Clamp(deck.BestTrialStars, 0, TrialRules.MaximumStars)
                : 0;
            var bestStars = Math.Max(currentBestStars, earnedStars);

            if (!hasCurrentResult || deck.BestTrialStars != bestStars) {
                deck.TrialResultRevision = deck.ContentRevision;
                deck.BestTrialStars = bestStars;
                await _context.SaveChangesAsync();
            }

            return Ok(new TrialResultResponse(
                request.CorrectAnswers,
                request.TotalQuestions,
                percentage,
                earnedStars,
                bestStars,
                deck.ContentRevision,
                deck.TrialResultRevision,
                bestStars > 0,
                requirements));
        }

        [HttpPost("{id}/highscore")]
        public async Task<IActionResult> UpdateHighScore(int id, [FromBody] UpdateHighScoreRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks.FirstOrDefaultAsync(d => d.Id == id && d.UserId == user.Id);
            if (deck == null) return NotFound();

            var isNewHighScore = request.Score > deck.HighScore;

            if (isNewHighScore) {
                deck.HighScore = request.Score;
                await _context.SaveChangesAsync();
            }

            return Ok(new { highScore = deck.HighScore, isNewHighScore });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeck(int id) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks.FirstOrDefaultAsync(d => d.Id == id && d.UserId == user.Id);
            if (deck == null) return NotFound();
            _context.Decks.Remove(deck);
            await _context.SaveChangesAsync();
            return Ok();
        }

        private async Task ClaimLocalDecks(int userId) {
            var localDecks = await _context.Decks
                .Where(d => d.UserId == 0)
                .ToListAsync();

            if (localDecks.Count == 0) return;

            foreach (var deck in localDecks) deck.UserId = userId;
            await _context.SaveChangesAsync();
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

        private static bool HasTrialRelevantChanges(Deck deck, UpdateDeckContentRequest request) {
            if (Normalize(deck.Language) != Normalize(request.Language) ||
                Normalize(deck.TranslationLanguage) != Normalize(request.TranslationLanguage) ||
                Normalize(deck.LearningLanguage) != Normalize(request.LearningLanguage) ||
                deck.Words.Count != request.Words.Count) {
                return true;
            }

            var persistedWords = deck.Words.ToDictionary(word => word.Id);
            foreach (var submittedWord in request.Words) {
                if (!submittedWord.Id.HasValue || !persistedWords.TryGetValue(submittedWord.Id.Value, out var persistedWord)) return true;
                if (Normalize(persistedWord.Original) != Normalize(submittedWord.Original) ||
                    Normalize(persistedWord.Translation) != Normalize(submittedWord.Translation) ||
                    Normalize(persistedWord.AlternativeOriginal) != Normalize(submittedWord.AlternativeOriginal) ||
                    Normalize(persistedWord.AlternativeTranslation) != Normalize(submittedWord.AlternativeTranslation) ||
                    Normalize(persistedWord.Hint) != Normalize(submittedWord.Hint)) {
                    return true;
                }
            }

            return false;
        }

        private static void ApplyWordChanges(Word word, UpdateDeckWordRequest request) {
            word.Original = request.Original.Trim();
            word.Translation = request.Translation.Trim();
            word.AlternativeOriginal = NullIfWhiteSpace(request.AlternativeOriginal);
            word.AlternativeTranslation = NullIfWhiteSpace(request.AlternativeTranslation);
            word.Hint = NullIfWhiteSpace(request.Hint);
        }

        private static string Normalize(string? value) => value?.Trim() ?? "";
        private static string? NullIfWhiteSpace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public record CreateDeckRequest(string Name, string Language, string? Description, string? TranslationLanguage, string? LearningLanguage);
    public record UpdateDeckContentRequest(string Name, string Language, string TranslationLanguage, string LearningLanguage, string? Description, List<UpdateDeckWordRequest> Words);
    public record UpdateDeckWordRequest(int? Id, string Original, string Translation, string? AlternativeOriginal, string? AlternativeTranslation, string? Hint);
    public record TrialResultRequest(int CorrectAnswers, int TotalQuestions);
    public record TrialResultResponse(
        int CorrectAnswers,
        int TotalQuestions,
        double Percentage,
        int EarnedStars,
        int BestStars,
        int ContentRevision,
        int? TrialResultRevision,
        bool IsTrialCompleted,
        IReadOnlyList<TrialStarRequirement> Requirements);
    public record UpdateHighScoreRequest(int Score);
}
