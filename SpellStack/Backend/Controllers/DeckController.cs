using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;

namespace LexiGo.Api.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class DeckController : ControllerBase {

        private readonly AppDbContext _context;

        public DeckController(AppDbContext context) {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDecks() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            await ClaimLocalDecks(user.Id);

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
            deck.Name = request.Name;
            deck.Language = request.Language;
            deck.TranslationLanguage = request.TranslationLanguage ?? "no";
            deck.LearningLanguage = request.LearningLanguage ?? request.TranslationLanguage ?? "no";
            deck.Description = request.Description ?? "";
            await _context.SaveChangesAsync();
            return Ok(deck);
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

    public record CreateDeckRequest(string Name, string Language, string? Description, string? TranslationLanguage, string? LearningLanguage);
    public record UpdateHighScoreRequest(int Score);
}
