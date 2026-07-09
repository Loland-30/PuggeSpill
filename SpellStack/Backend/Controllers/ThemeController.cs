using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Services;

namespace SpellStack.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class ThemeController : ControllerBase {
        private const long MaxThemeBackgroundBytes = 6 * 1024 * 1024;
        private const string ThemeBackgroundUrlPrefix = "/uploads/theme-backgrounds/";

        private static readonly Dictionary<string, string[]> AllowedImageExtensionsByContentType =
            new(StringComparer.OrdinalIgnoreCase) {
                ["image/jpeg"] = [".jpg", ".jpeg"],
                ["image/png"] = [".png"],
                ["image/webp"] = [".webp"],
                ["image/gif"] = [".gif"]
            };

        private readonly AppDbContext _context;
        private readonly UploadStorageService _uploadStorage;

        public ThemeController(AppDbContext context, UploadStorageService uploadStorage) {
            _context = context;
            _uploadStorage = uploadStorage;
        }

        [HttpGet]
        public async Task<IActionResult> GetTheme() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            return Ok(new ThemeResponse(user.ThemeJson));
        }

        [HttpPost("background-image")]
        [RequestSizeLimit(MaxThemeBackgroundBytes + 64 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxThemeBackgroundBytes + 64 * 1024)]
        public async Task<IActionResult> UploadBackgroundImage([FromForm(Name = "image")] IFormFile? image) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var validationError = ValidateImage(image);
            if (validationError != null) return BadRequest(validationError);

            var extension = GetValidatedExtension(image!)
                ?? throw new InvalidOperationException("Image validation must run before saving.");
            var uploadRoot = _uploadStorage.GetUploadFolder("theme-backgrounds");
            Directory.CreateDirectory(uploadRoot);

            var fileName = $"{user.Id}-{Guid.NewGuid():N}{extension}";
            var destinationPath = Path.GetFullPath(Path.Combine(uploadRoot, fileName));
            UploadStorageService.EnsurePathIsInsideDirectory(destinationPath, uploadRoot);

            await using (var stream = System.IO.File.Create(destinationPath)) {
                await image!.CopyToAsync(stream);
            }

            return Ok(new ThemeBackgroundImageResponse($"{ThemeBackgroundUrlPrefix}{fileName}"));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateTheme([FromBody] ThemeRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            user.ThemeJson = request.ThemeJson ?? "";
            await _context.SaveChangesAsync();

            return Ok(new ThemeResponse(user.ThemeJson));
        }

        private static string? ValidateImage(IFormFile? image) {
            if (image == null || image.Length <= 0) return "Image file is required.";
            if (image.Length > MaxThemeBackgroundBytes) return "Theme background image must be 6 MB or smaller.";

            return GetValidatedExtension(image) == null
                ? "Only JPEG, PNG, WEBP and GIF theme backgrounds are allowed."
                : null;
        }

        private static string? GetValidatedExtension(IFormFile image) {
            if (!AllowedImageExtensionsByContentType.TryGetValue(image.ContentType, out var allowedExtensions)) return null;

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(extension)) return allowedExtensions[0];

            return allowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase) ? extension : null;
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
    }

    public record ThemeRequest(string? ThemeJson);
    public record ThemeResponse(string ThemeJson);
    public record ThemeBackgroundImageResponse(string Url);
}
