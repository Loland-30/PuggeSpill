namespace SpellStack.Api.Services;

public static class PasswordPolicy {
    public const int MinimumLength = 10;
    public const int MaximumLength = 256;

    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase) {
        "password", "password1", "password123", "qwerty123", "letmein123",
        "admin123", "welcome123", "iloveyou", "1234567890", "spellstack"
    };

    private static readonly string[] PredictableSequences = [
        "012345", "123456", "234567", "345678", "456789",
        "abcdef", "qwerty", "asdfgh", "zxcvbn"
    ];

    public static PasswordPolicyResult Validate(
        string password,
        string? email = null,
        string? username = null) {
        if (password.Length < MinimumLength) {
            return PasswordPolicyResult.Invalid(
                $"Password must be at least {MinimumLength} characters.");
        }
        if (password.Length > MaximumLength) {
            return PasswordPolicyResult.Invalid(
                $"Password must be at most {MaximumLength} characters.");
        }

        var normalized = password.Trim().ToLowerInvariant();
        if (CommonPasswords.Contains(normalized) ||
            PredictableSequences.Any(normalized.Contains) ||
            normalized.Distinct().Count() <= 2) {
            return PasswordPolicyResult.Invalid("Choose a less predictable password.");
        }

        var emailName = email?.Split('@', 2)[0].Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(emailName) &&
            emailName.Length >= 3 &&
            normalized.Contains(emailName)) {
            return PasswordPolicyResult.Invalid(
                "Password must not contain your email address.");
        }

        var normalizedUsername = username?.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(normalizedUsername) &&
            normalizedUsername.Length >= 3 &&
            normalized.Contains(normalizedUsername)) {
            return PasswordPolicyResult.Invalid(
                "Password must not contain your username.");
        }

        var wordCount = password
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Length;
        if (password.Length >= 16 && wordCount >= 3) {
            return PasswordPolicyResult.Valid();
        }

        var characterClasses = 0;
        if (password.Any(char.IsLower)) characterClasses++;
        if (password.Any(char.IsUpper)) characterClasses++;
        if (password.Any(char.IsDigit)) characterClasses++;
        if (password.Any(character => !char.IsLetterOrDigit(character))) characterClasses++;

        if (password.Length < 12 && characterClasses < 3) {
            return PasswordPolicyResult.Invalid(
                "Use a longer passphrase or a less predictable mix of characters.");
        }

        return PasswordPolicyResult.Valid();
    }
}

public sealed record PasswordPolicyResult(bool IsValid, string? Error) {
    public static PasswordPolicyResult Valid() => new(true, null);
    public static PasswordPolicyResult Invalid(string error) => new(false, error);
}
