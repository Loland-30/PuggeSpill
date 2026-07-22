using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Services;

namespace SpellStack.Api.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class WordController : ControllerBase {

        private readonly AppDbContext _context;

        public WordController(AppDbContext context) {
            _context = context;
        }

        [HttpGet("deck/{deckId}")]
        public async Task<IActionResult> GetWords(int deckId) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var ownsDeck = await _context.Decks.AnyAsync(d => d.Id == deckId && d.UserId == user.Id);
            if (!ownsDeck) return NotFound();

            var words = await _context.Words
                .Where(w => w.DeckId == deckId)
                .ToListAsync();
            return Ok(words);
        }

        [HttpPost]
        public async Task<IActionResult> AddWord([FromBody] AddWordRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks.FirstOrDefaultAsync(d => d.Id == request.DeckId && d.UserId == user.Id);
            if (deck == null) return NotFound();

            var word = new Word {
                Original = request.Original,
                Translation = request.Translation,
                AlternativeOriginal = request.AlternativeOriginal,
                AlternativeTranslation = request.AlternativeTranslation,
                Hint = request.Hint,
                DeckId = request.DeckId
            };
            _context.Words.Add(word);
            deck.ContentRevision++;
            await _context.SaveChangesAsync();
            return Ok(word);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWord(int id, [FromBody] AddWordRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var word = await _context.Words
                .Include(w => w.Deck)
                .FirstOrDefaultAsync(w => w.Id == id && w.Deck.UserId == user.Id);
            if (word == null) return NotFound();
            if (request.DeckId != word.DeckId) return BadRequest("Word deck cannot be changed.");

            var contentChanged = Normalize(word.Original) != Normalize(request.Original) ||
                Normalize(word.Translation) != Normalize(request.Translation) ||
                Normalize(word.AlternativeOriginal) != Normalize(request.AlternativeOriginal) ||
                Normalize(word.AlternativeTranslation) != Normalize(request.AlternativeTranslation) ||
                Normalize(word.Hint) != Normalize(request.Hint);

            word.Original = request.Original;
            word.Translation = request.Translation;
            word.AlternativeOriginal = request.AlternativeOriginal;
            word.AlternativeTranslation = request.AlternativeTranslation;
            word.Hint = request.Hint;

            if (contentChanged) word.Deck.ContentRevision++;

            await _context.SaveChangesAsync();
            return Ok(word);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWord(int id) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var word = await _context.Words
                .Include(w => w.Deck)
                .FirstOrDefaultAsync(w => w.Id == id && w.Deck.UserId == user.Id);
            if (word == null) return NotFound();
            _context.Words.Remove(word);
            word.Deck.ContentRevision++;
            await _context.SaveChangesAsync();
            return Ok();
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

        private static string Normalize(string? value) => value?.Trim() ?? "";
    }

    public record AddWordRequest(string Original, string Translation, string? AlternativeOriginal, string? AlternativeTranslation, string? Hint, int DeckId);
}
