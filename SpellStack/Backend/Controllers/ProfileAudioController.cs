using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace SpellStack.Api.Controllers {
    [ApiController]
    [Route("api/profile/audio")]
    public class ProfileAudioController : ControllerBase {
        private const long MaxLoginSplashBytes = 3 * 1024 * 1024;
        private const long MaxMainMenuMusicBytes = 10 * 1024 * 1024;
        private const string LoginSplashUrlPrefix = "/uploads/audio/login-splash/";
        private const string MainMenuMusicUrlPrefix = "/uploads/audio/main-menu/";

        private static readonly Dictionary<string, string[]> AllowedExtensionsByContentType =
            new(StringComparer.OrdinalIgnoreCase) {
                ["audio/mpeg"] = [".mp3"],
                ["audio/mp3"] = [".mp3"],
                ["audio/x-mpeg"] = [".mp3"],
                ["audio/wav"] = [".wav"],
                ["audio/x-wav"] = [".wav"],
                ["audio/vnd.wave"] = [".wav"],
                ["audio/ogg"] = [".ogg"],
                ["audio/mp4"] = [".m4a"],
                ["audio/m4a"] = [".m4a"],
                ["audio/x-m4a"] = [".m4a"]
            };

        private readonly AppDbContext _context;
        private readonly UploadStorageService _uploadStorage;

        public ProfileAudioController(AppDbContext context, UploadStorageService uploadStorage) {
            _context = context;
            _uploadStorage = uploadStorage;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            return Ok(new ProfileAudioSettingsResponse(
                user.CustomLoginSplashSoundUrl,
                user.CustomMainMenuMusicUrl
            ));
        }

        [HttpPost("login-splash")]
        [RequestSizeLimit(MaxLoginSplashBytes + 64 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxLoginSplashBytes + 64 * 1024)]
        public async Task<IActionResult> UploadLoginSplash([FromForm(Name = "audio")] IFormFile? audio) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var validationError = ValidateAudio(audio, MaxLoginSplashBytes, "Login splash sound");
            if (validationError != null) return BadRequest(validationError);

            var previousUrl = user.CustomLoginSplashSoundUrl;
            var uploadedAudio = await SaveAudio(
                audio!,
                user.Id,
                "login-splash",
                LoginSplashUrlPrefix
            );
            user.CustomLoginSplashSoundUrl = uploadedAudio.Url;

            try {
                await _context.SaveChangesAsync();
            } catch {
                DeleteAudioFile(uploadedAudio.Url, LoginSplashUrlPrefix, "login-splash");
                throw;
            }

            DeleteAudioFile(previousUrl, LoginSplashUrlPrefix, "login-splash");

            return Ok(ToUserResponse(user));
        }

        [HttpDelete("login-splash")]
        public async Task<IActionResult> DeleteLoginSplash() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var previousUrl = user.CustomLoginSplashSoundUrl;
            user.CustomLoginSplashSoundUrl = null;
            await _context.SaveChangesAsync();
            DeleteAudioFile(previousUrl, LoginSplashUrlPrefix, "login-splash");

            return Ok(ToUserResponse(user));
        }

        [HttpPost("main-menu")]
        [RequestSizeLimit(MaxMainMenuMusicBytes + 64 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxMainMenuMusicBytes + 64 * 1024)]
        public async Task<IActionResult> UploadMainMenuMusic([FromForm(Name = "audio")] IFormFile? audio) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var validationError = ValidateAudio(audio, MaxMainMenuMusicBytes, "Main menu music");
            if (validationError != null) return BadRequest(validationError);

            var previousUrl = user.CustomMainMenuMusicUrl;
            var uploadedAudio = await SaveAudio(
                audio!,
                user.Id,
                "main-menu",
                MainMenuMusicUrlPrefix
            );
            user.CustomMainMenuMusicUrl = uploadedAudio.Url;

            try {
                await _context.SaveChangesAsync();
            } catch {
                DeleteAudioFile(uploadedAudio.Url, MainMenuMusicUrlPrefix, "main-menu");
                throw;
            }

            DeleteAudioFile(previousUrl, MainMenuMusicUrlPrefix, "main-menu");

            return Ok(ToUserResponse(user));
        }

        [HttpDelete("main-menu")]
        public async Task<IActionResult> DeleteMainMenuMusic() {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var previousUrl = user.CustomMainMenuMusicUrl;
            user.CustomMainMenuMusicUrl = null;
            await _context.SaveChangesAsync();
            DeleteAudioFile(previousUrl, MainMenuMusicUrlPrefix, "main-menu");

            return Ok(ToUserResponse(user));
        }

        private async Task<SavedAudio> SaveAudio(
            IFormFile audio,
            int userId,
            string folderName,
            string urlPrefix
        ) {
            var extension = GetValidatedExtension(audio)
                ?? throw new InvalidOperationException("Audio validation must run before saving.");
            var uploadRoot = GetAudioUploadRoot(folderName);
            Directory.CreateDirectory(uploadRoot);

            var fileName = $"{userId}-{Guid.NewGuid():N}{extension}";
            var destinationPath = Path.GetFullPath(Path.Combine(uploadRoot, fileName));
            EnsurePathIsInsideDirectory(destinationPath, uploadRoot);

            await using (var stream = System.IO.File.Create(destinationPath)) {
                await audio.CopyToAsync(stream);
            }

            return new SavedAudio($"{urlPrefix}{fileName}");
        }

        private static string? ValidateAudio(IFormFile? audio, long maxBytes, string label) {
            if (audio == null || audio.Length <= 0) return $"{label} file is required.";
            if (audio.Length > maxBytes) {
                return $"{label} must be {maxBytes / (1024 * 1024)} MB or smaller.";
            }

            return GetValidatedExtension(audio) == null
                ? "Only MP3, WAV, OGG and M4A audio files are allowed."
                : null;
        }

        private static string? GetValidatedExtension(IFormFile audio) {
            if (!AllowedExtensionsByContentType.TryGetValue(audio.ContentType, out var allowedExtensions)) return null;

            var extension = Path.GetExtension(audio.FileName).ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(extension)) return null;

            return allowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase) ? extension : null;
        }

        private string GetAudioUploadRoot(string folderName) {
            return _uploadStorage.GetUploadFolder("audio", folderName);
        }

        private void DeleteAudioFile(string? audioUrl, string expectedUrlPrefix, string folderName) {
            if (string.IsNullOrWhiteSpace(audioUrl)) return;
            if (!audioUrl.StartsWith(expectedUrlPrefix, StringComparison.Ordinal)) return;

            var fileName = Path.GetFileName(audioUrl);
            if (string.IsNullOrWhiteSpace(fileName)) return;

            var uploadRoot = GetAudioUploadRoot(folderName);
            var fullPath = Path.GetFullPath(Path.Combine(uploadRoot, fileName));
            if (!IsPathInsideDirectory(fullPath, uploadRoot)) return;
            if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
        }

        private async Task<User?> GetCurrentUser() {
            var token = GetBearerToken();
            if (token == null) return null;

            var tokenHash = SessionTokenHasher.Hash(token);
            var session = await _context.UserSessions
                .Include(item => item.User)
                .FirstOrDefaultAsync(item => item.TokenHash == tokenHash && item.ExpiresAt > DateTime.UtcNow);

            return session?.User;
        }

        private string? GetBearerToken() {
            var header = Request.Headers.Authorization.ToString();
            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
            return header["Bearer ".Length..].Trim();
        }

        private static void EnsurePathIsInsideDirectory(string path, string directory) {
            if (!IsPathInsideDirectory(path, directory)) {
                throw new InvalidOperationException("Resolved upload path is outside the audio upload directory.");
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
                user.Country,
                user.CreatedAt,
                user.ProfileImageUrl,
                user.CustomLoginSplashSoundUrl,
                user.CustomMainMenuMusicUrl,
                user.IsAdmin
            );
        }

        private sealed record SavedAudio(string Url);
    }

    public record ProfileAudioSettingsResponse(
        string? CustomLoginSplashSoundUrl,
        string? CustomMainMenuMusicUrl
    );
}
