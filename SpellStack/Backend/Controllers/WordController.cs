using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;

namespace LexiGo.Api.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class WordController : ControllerBase {

        private readonly AppDbContext _context;

        public WordController(AppDbContext context) {
            _context = context;
        }

        [HttpGet("deck/{deckId}")]
        public async Task<IActionResult> GetWords(int deckId) {
            var words = await _context.Words
                .Where(w => w.DeckId == deckId)
                .ToListAsync();
            return Ok(words);
        }

        [HttpPost]
        public async Task<IActionResult> AddWord([FromBody] AddWordRequest request) {
            var word = new Word {
                Original = request.Original,
                Translation = request.Translation,
                AlternativeTranslation = request.AlternativeTranslation,
                Hint = request.Hint,
                DeckId = request.DeckId
            };
            _context.Words.Add(word);
            await _context.SaveChangesAsync();
            return Ok(word);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWord(int id, [FromBody] AddWordRequest request) {
            var word = await _context.Words.FindAsync(id);
            if (word == null) return NotFound();

            word.Original = request.Original;
            word.Translation = request.Translation;
            word.AlternativeTranslation = request.AlternativeTranslation;
            word.Hint = request.Hint;

            await _context.SaveChangesAsync();
            return Ok(word);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWord(int id) {
            var word = await _context.Words.FindAsync(id);
            if (word == null) return NotFound();
            _context.Words.Remove(word);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }

    public record AddWordRequest(string Original, string Translation, string? AlternativeTranslation, string? Hint, int DeckId);
}
