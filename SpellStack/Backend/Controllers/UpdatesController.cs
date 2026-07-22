using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;
using SpellStack.Api.Models;

namespace SpellStack.Api.Controllers {
    [ApiController]
    [Route("api/updates")]
    public partial class UpdatesController : ControllerBase {
        private readonly AppDbContext _context;

        public UpdatesController(AppDbContext context) {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UpdateListItemResponse>>> GetUpdates() {
            var updates = await _context.UpdatePosts
                .AsNoTracking()
                .Where(post => post.IsPublished)
                .OrderByDescending(post => post.PublishedAt)
                .ThenByDescending(post => post.Id)
                .Select(post => new UpdateListItemResponse(
                    post.Id,
                    post.Slug,
                    post.Version,
                    post.Title,
                    post.Summary,
                    post.Category,
                    post.Status,
                    post.PublishedAt
                ))
                .ToListAsync();

            return Ok(updates);
        }

        [HttpGet("{slug}")]
        public async Task<ActionResult<UpdateDetailsResponse>> GetUpdate(string slug) {
            var normalizedSlug = NormalizeSlug(slug);
            var update = await _context.UpdatePosts
                .AsNoTracking()
                .Where(post => post.IsPublished && post.Slug == normalizedSlug)
                .Select(post => new UpdateDetailsResponse(
                    post.Id,
                    post.Slug,
                    post.Version,
                    post.Title,
                    post.Summary,
                    post.Content,
                    post.Category,
                    post.Status,
                    post.PublishedAt,
                    post.CreatedAt,
                    post.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            return update == null ? NotFound() : Ok(update);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<UpdateDetailsResponse>> CreateUpdate([FromBody] UpdatePostRequest request) {
            var validationError = ValidateRequest(request);
            if (validationError != null) return BadRequest(validationError);

            var slug = BuildSlug(request);
            if (string.IsNullOrWhiteSpace(slug)) return BadRequest("Slug could not be generated.");
            if (slug.Length > 160) return BadRequest("Slug must be 160 characters or fewer.");
            if (await _context.UpdatePosts.AnyAsync(post => post.Slug == slug)) {
                return Conflict("An update with this slug already exists.");
            }

            var now = DateTime.UtcNow;
            var update = new UpdatePost {
                Slug = slug,
                Version = request.Version.Trim(),
                Title = request.Title.Trim(),
                Summary = request.Summary.Trim(),
                Content = request.Content.Trim(),
                Category = request.Category.Trim(),
                Status = request.Status.Trim(),
                IsPublished = request.IsPublished,
                PublishedAt = request.IsPublished ? ToUtc(request.PublishedAt) ?? now : null,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.UpdatePosts.Add(update);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUpdate), new { slug = update.Slug }, ToDetailsResponse(update));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<ActionResult<UpdateDetailsResponse>> UpdateUpdate(int id, [FromBody] UpdatePostRequest request) {
            var validationError = ValidateRequest(request);
            if (validationError != null) return BadRequest(validationError);

            var update = await _context.UpdatePosts.FindAsync(id);
            if (update == null) return NotFound();

            var slug = BuildSlug(request);
            if (string.IsNullOrWhiteSpace(slug)) return BadRequest("Slug could not be generated.");
            if (slug.Length > 160) return BadRequest("Slug must be 160 characters or fewer.");
            if (await _context.UpdatePosts.AnyAsync(post => post.Id != id && post.Slug == slug)) {
                return Conflict("An update with this slug already exists.");
            }

            update.Slug = slug;
            update.Version = request.Version.Trim();
            update.Title = request.Title.Trim();
            update.Summary = request.Summary.Trim();
            update.Content = request.Content.Trim();
            update.Category = request.Category.Trim();
            update.Status = request.Status.Trim();
            update.IsPublished = request.IsPublished;
            update.PublishedAt = request.IsPublished
                ? ToUtc(request.PublishedAt) ?? update.PublishedAt ?? DateTime.UtcNow
                : null;
            update.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ToDetailsResponse(update));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteUpdate(int id) {
            var update = await _context.UpdatePosts.FindAsync(id);
            if (update == null) return NotFound();

            _context.UpdatePosts.Remove(update);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static string? ValidateRequest(UpdatePostRequest request) {
            if (string.IsNullOrWhiteSpace(request.Version)) return "Version is required.";
            if (string.IsNullOrWhiteSpace(request.Title)) return "Title is required.";
            if (string.IsNullOrWhiteSpace(request.Summary)) return "Summary is required.";
            if (string.IsNullOrWhiteSpace(request.Content)) return "Content is required.";
            if (string.IsNullOrWhiteSpace(request.Category)) return "Category is required.";
            if (string.IsNullOrWhiteSpace(request.Status)) return "Status is required.";
            if (request.Version.Trim().Length > 32) return "Version must be 32 characters or fewer.";
            if (request.Title.Trim().Length > 180) return "Title must be 180 characters or fewer.";
            if (request.Summary.Trim().Length > 500) return "Summary must be 500 characters or fewer.";
            if (request.Category.Trim().Length > 64) return "Category must be 64 characters or fewer.";
            if (request.Status.Trim().Length > 64) return "Status must be 64 characters or fewer.";

            return null;
        }

        private static string BuildSlug(UpdatePostRequest request) {
            var source = string.IsNullOrWhiteSpace(request.Slug)
                ? $"{request.Version} {request.Title}"
                : request.Slug;

            return NormalizeSlug(source);
        }

        private static string NormalizeSlug(string value) {
            var normalized = InvalidSlugCharacters().Replace(value.Trim().ToLowerInvariant(), "-");
            return RepeatedHyphens().Replace(normalized, "-").Trim('-');
        }

        private static DateTime? ToUtc(DateTime? value) {
            if (value == null) return null;
            return value.Value.Kind == DateTimeKind.Utc
                ? value
                : value.Value.ToUniversalTime();
        }

        private static UpdateDetailsResponse ToDetailsResponse(UpdatePost post) {
            return new UpdateDetailsResponse(
                post.Id,
                post.Slug,
                post.Version,
                post.Title,
                post.Summary,
                post.Content,
                post.Category,
                post.Status,
                post.PublishedAt,
                post.CreatedAt,
                post.UpdatedAt
            );
        }

        [GeneratedRegex("[^a-z0-9]+")]
        private static partial Regex InvalidSlugCharacters();

        [GeneratedRegex("-{2,}")]
        private static partial Regex RepeatedHyphens();
    }

    public record UpdatePostRequest(
        string? Slug,
        string Version,
        string Title,
        string Summary,
        string Content,
        string Category,
        string Status,
        bool IsPublished,
        DateTime? PublishedAt
    );

    public record UpdateListItemResponse(
        int Id,
        string Slug,
        string Version,
        string Title,
        string Summary,
        string Category,
        string Status,
        DateTime? PublishedAt
    );

    public record UpdateDetailsResponse(
        int Id,
        string Slug,
        string Version,
        string Title,
        string Summary,
        string Content,
        string Category,
        string Status,
        DateTime? PublishedAt,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );
}
