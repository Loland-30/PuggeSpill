using System.Text;

namespace SpellStack.Api.Services;

public static class AnswerEvaluator {
    public static bool IsAccepted(
        string? submittedAnswer,
        string? expectedAnswer,
        string? commaSeparatedAlternatives = null) {
        var normalizedSubmitted = NormalizeForComparison(submittedAnswer);
        if (string.IsNullOrEmpty(normalizedSubmitted)) return false;

        if (normalizedSubmitted == NormalizeForComparison(expectedAnswer)) return true;
        if (string.IsNullOrWhiteSpace(commaSeparatedAlternatives)) return false;

        return commaSeparatedAlternatives
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(alternative => normalizedSubmitted == NormalizeForComparison(alternative));
    }

    public static string NormalizeForComparison(string? value) {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        return value
            .Trim()
            .Normalize(NormalizationForm.FormC)
            .ToLowerInvariant();
    }
}
