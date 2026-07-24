using System.Security.Cryptography;

namespace SpellStack.Api.Services {
    public static class PasswordHasher {
        public static string CreateSalt() {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        }

        public static string HashPassword(string password, string salt) {
            var saltBytes = Convert.FromBase64String(salt);
            var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
                password,
                saltBytes,
                100_000,
                HashAlgorithmName.SHA256,
                32
            );
            return Convert.ToBase64String(hashBytes);
        }

        public static bool VerifyPassword(string password, string salt, string expectedHash) {
            try {
                var actual = Convert.FromBase64String(HashPassword(password, salt));
                var expected = Convert.FromBase64String(expectedHash);
                return CryptographicOperations.FixedTimeEquals(actual, expected);
            } catch (FormatException) {
                return false;
            }
        }
    }
}
