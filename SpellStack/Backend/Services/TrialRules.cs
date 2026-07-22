namespace SpellStack.Api.Services {
    public static class TrialRules {
        public const int MinimumDeckWordCount = 10;
        public const int OneStarThresholdPercent = 70;
        public const int TwoStarThresholdPercent = 80;
        public const int MaximumStars = 3;

        public static IReadOnlyList<TrialStarRequirement> GetRequirements(int totalQuestions) {
            if (totalQuestions <= 0) throw new ArgumentOutOfRangeException(nameof(totalQuestions));

            return [
                new TrialStarRequirement(1, OneStarThresholdPercent, RequiredCorrect(totalQuestions, OneStarThresholdPercent)),
                new TrialStarRequirement(2, TwoStarThresholdPercent, RequiredCorrect(totalQuestions, TwoStarThresholdPercent)),
                new TrialStarRequirement(MaximumStars, 100, totalQuestions)
            ];
        }

        public static int CalculateEarnedStars(int correctAnswers, int totalQuestions) {
            var requirements = GetRequirements(totalQuestions);
            return requirements
                .Where(requirement => correctAnswers >= requirement.RequiredCorrect)
                .Select(requirement => requirement.Stars)
                .DefaultIfEmpty(0)
                .Max();
        }

        private static int RequiredCorrect(int totalQuestions, int thresholdPercent) {
            return (int)Math.Ceiling(totalQuestions * thresholdPercent / 100d);
        }
    }

    public sealed record TrialStarRequirement(int Stars, int ThresholdPercent, int RequiredCorrect);
}
