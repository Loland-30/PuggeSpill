using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;
using LexiGo.Api.Models;
using LexiGo.Api.Services;
using System.Net.Mail;

namespace LexiGo.Api.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase {
        private const long MaxProfileImageBytes = 2 * 1024 * 1024;
        private const string ProfileImageUrlPrefix = "/uploads/profile-images/";

        private static readonly Dictionary<string, string[]> AllowedImageExtensionsByContentType = new(StringComparer.OrdinalIgnoreCase) {
            ["image/jpeg"] = [".jpg", ".jpeg"],
            ["image/png"] = [".png"],
            ["image/webp"] = [".webp"],
            ["image/gif"] = [".gif"]
        };

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ProfileController(AppDbContext context, IWebHostEnvironment environment) {
            _context = context;
            _environment = environment;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> Summary() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deckIds = await _context.Decks
                .Where(d => d.UserId == user.Id)
                .Select(d => d.Id)
                .ToListAsync();
            var userRuns = _context.GameRunResults
                .Where(result =>
                    result.UserId == user.Id &&
                    deckIds.Contains(result.DeckId) &&
                    (result.EndReason == "completed" || result.EndReason == "gameOver"));
            var runsPlayed = await userRuns.CountAsync();
            var longestStreak = await userRuns.AnyAsync()
                ? await userRuns.MaxAsync(result => result.BestStreak)
                : 0;
            var wordsLearned = await _context.Words.CountAsync(w => deckIds.Contains(w.DeckId));

            return Ok(new ProfileSummaryResponse(runsPlayed, longestStreak, wordsLearned));
        }

        [HttpGet("languages")]
        public async Task<IActionResult> Languages() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var decks = await _context.Decks
                .Include(d => d.Words)
                .Where(d => d.UserId == user.Id)
                .ToListAsync();
            var languageDeckIds = decks.Select(d => d.Id).ToList();
            var runResults = await _context.GameRunResults
                .Where(result =>
                    result.UserId == user.Id &&
                    languageDeckIds.Contains(result.DeckId) &&
                    (result.EndReason == "completed" || result.EndReason == "gameOver"))
                .ToListAsync();

            var stats = decks
                .GroupBy(d => string.IsNullOrWhiteSpace(d.LearningLanguage)
                    ? string.IsNullOrWhiteSpace(d.TranslationLanguage) ? d.Language : d.TranslationLanguage
                    : d.LearningLanguage)
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .Select(group => {
                    var deckIds = group.Select(d => d.Id).ToHashSet();
                    var languageRuns = runResults.Where(result => deckIds.Contains(result.DeckId)).ToList();

                    return new LanguageStatsResponse(
                        group.Key,
                        languageRuns.Count,
                        languageRuns.Count == 0 ? 0 : languageRuns.Max(result => result.BestStreak),
                        group.SelectMany(d => d.Words).Select(w => w.Id).Distinct().Count()
                    );
                })
                .OrderBy(stat => stat.LanguageCode)
                .ToList();

            return Ok(stats);
        }

        [HttpPut("account")]
        public async Task<IActionResult> UpdateAccount([FromBody] UpdateAccountRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var username = request.Username?.Trim() ?? "";
            var email = request.Email?.Trim().ToLowerInvariant() ?? "";

            if (username.Length < 2) return BadRequest("Brukernavnet er for kort");
            if (!IsValidEmail(email)) return BadRequest("E-posten er ugyldig");

            var normalizedUsername = username.ToLowerInvariant();
            var usernameExists = await _context.Users.AnyAsync(otherUser =>
                otherUser.Id != user.Id &&
                otherUser.Username.ToLower() == normalizedUsername);
            if (usernameExists) return Conflict("Brukernavnet er allerede i bruk");

            var emailExists = await _context.Users.AnyAsync(otherUser =>
                otherUser.Id != user.Id &&
                otherUser.Email.ToLower() == email);
            if (emailExists) return Conflict("E-posten er allerede i bruk");

            user.Username = username;
            user.Email = email;
            await _context.SaveChangesAsync();

            return Ok(ToUserResponse(user));
        }

        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            if (
                string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword) ||
                string.IsNullOrWhiteSpace(request.ConfirmPassword)
            ) {
                return BadRequest("Alle passordfelt maa fylles ut");
            }

            if (request.NewPassword.Length < 6) return BadRequest("Passord maa vaere minst 6 tegn");
            if (request.NewPassword != request.ConfirmPassword) return BadRequest("Passordene matcher ikke");

            if (!PasswordHasher.VerifyPassword(request.CurrentPassword, user.PasswordSalt, user.PasswordHash)) {
                return BadRequest("Naavaerende passord er feil");
            }

            var salt = PasswordHasher.CreateSalt();
            user.PasswordSalt = salt;
            user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword, salt);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Passordet er oppdatert" });
        }

        [HttpPost("image")]
        [RequestSizeLimit(MaxProfileImageBytes)]
        public async Task<IActionResult> UploadImage([FromForm(Name = "image")] IFormFile? image) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            if (image == null || image.Length <= 0) return BadRequest("Image file is required.");
            if (image.Length > MaxProfileImageBytes) return BadRequest("Profile image must be 2 MB or smaller.");

            var extension = GetValidatedExtension(image);
            if (extension == null) return BadRequest("Only JPEG, PNG, WEBP and GIF profile images are allowed.");

            var uploadRoot = GetProfileImageUploadRoot();
            Directory.CreateDirectory(uploadRoot);

            DeleteProfileImageFile(user.ProfileImageUrl);

            var fileName = $"{user.Id}-{Guid.NewGuid():N}{extension}";
            var destinationPath = Path.GetFullPath(Path.Combine(uploadRoot, fileName));
            EnsurePathIsInsideDirectory(destinationPath, uploadRoot);

            await using (var stream = System.IO.File.Create(destinationPath)) {
                await image.CopyToAsync(stream);
            }

            user.ProfileImageUrl = $"{ProfileImageUrlPrefix}{fileName}";
            await _context.SaveChangesAsync();

            return Ok(ToUserResponse(user));
        }

        [HttpDelete("image")]
        public async Task<IActionResult> DeleteImage() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            DeleteProfileImageFile(user.ProfileImageUrl);
            user.ProfileImageUrl = null;
            await _context.SaveChangesAsync();

            return Ok(ToUserResponse(user));
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

        private static bool IsValidEmail(string email) {
            if (string.IsNullOrWhiteSpace(email)) return false;

            try {
                var address = new MailAddress(email);
                return address.Address.Equals(email, StringComparison.OrdinalIgnoreCase);
            } catch {
                return false;
            }
        }

        private string GetProfileImageUploadRoot() {
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot)) {
                webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            return Path.GetFullPath(Path.Combine(webRoot, "uploads", "profile-images"));
        }

        private static string? GetValidatedExtension(IFormFile image) {
            if (!AllowedImageExtensionsByContentType.TryGetValue(image.ContentType, out var allowedExtensions)) return null;

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(extension)) return allowedExtensions[0];

            return allowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase) ? extension : null;
        }

        private void DeleteProfileImageFile(string? profileImageUrl) {
            if (string.IsNullOrWhiteSpace(profileImageUrl)) return;
            if (!profileImageUrl.StartsWith(ProfileImageUrlPrefix, StringComparison.Ordinal)) return;

            var fileName = Path.GetFileName(profileImageUrl);
            if (string.IsNullOrWhiteSpace(fileName)) return;

            var uploadRoot = GetProfileImageUploadRoot();
            var fullPath = Path.GetFullPath(Path.Combine(uploadRoot, fileName));

            if (!IsPathInsideDirectory(fullPath, uploadRoot)) return;
            if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
        }

        private static void EnsurePathIsInsideDirectory(string path, string directory) {
            if (!IsPathInsideDirectory(path, directory)) {
                throw new InvalidOperationException("Resolved upload path is outside the profile image directory.");
            }
        }

        private static bool IsPathInsideDirectory(string path, string directory) {
            var normalizedDirectory = Path.GetFullPath(directory)
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
            var normalizedPath = Path.GetFullPath(path);

            return normalizedPath.StartsWith(normalizedDirectory, StringComparison.OrdinalIgnoreCase);
        }

        private static UserResponse ToUserResponse(User user) {
            return new UserResponse(
                user.Id,
                user.Username,
                user.Email,
                user.FavoriteLanguage,
                user.CreatedAt,
                user.ProfileImageUrl,
                user.CustomLoginSplashSoundUrl,
                user.CustomMainMenuMusicUrl
            );
        }
    }

    public record ProfileSummaryResponse(int RunsPlayed, int LongestStreak, int WordsLearned);
    public record LanguageStatsResponse(string LanguageCode, int RunsPlayed, int LongestStreak, int WordsLearned);
    public record UpdateAccountRequest(string Username, string Email);
    public record UpdatePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);
}
