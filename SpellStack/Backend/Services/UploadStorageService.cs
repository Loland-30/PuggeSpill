using Microsoft.Extensions.FileProviders;

namespace SpellStack.Api.Services {
    public class UploadStorageService {
        private readonly IWebHostEnvironment _environment;

        public UploadStorageService(IWebHostEnvironment environment) {
            _environment = environment;
        }

        public string UploadRoot {
            get {
                var configuredRoot = Environment.GetEnvironmentVariable("UPLOAD_ROOT");
                if (!string.IsNullOrWhiteSpace(configuredRoot)) {
                    return Path.GetFullPath(configuredRoot);
                }

                var webRoot = _environment.WebRootPath;
                if (string.IsNullOrWhiteSpace(webRoot)) {
                    webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
                }

                return Path.GetFullPath(Path.Combine(webRoot, "uploads"));
            }
        }

        public IFileProvider CreateFileProvider() {
            Directory.CreateDirectory(UploadRoot);
            return new PhysicalFileProvider(UploadRoot);
        }

        public string GetUploadFolder(params string[] pathSegments) {
            var folder = Path.Combine(new[] { UploadRoot }.Concat(pathSegments).ToArray());
            return Path.GetFullPath(folder);
        }

        public static void EnsurePathIsInsideDirectory(string path, string directory) {
            if (!IsPathInsideDirectory(path, directory)) {
                throw new InvalidOperationException("Resolved upload path is outside the upload directory.");
            }
        }

        public static bool IsPathInsideDirectory(string path, string directory) {
            var normalizedDirectory = Path.GetFullPath(directory)
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
            var normalizedPath = Path.GetFullPath(path);

            return normalizedPath.StartsWith(normalizedDirectory, StringComparison.OrdinalIgnoreCase);
        }
    }
}
