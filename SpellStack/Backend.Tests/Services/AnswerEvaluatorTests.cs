using SpellStack.Api.Services;
using Xunit;

namespace Backend.Tests.Services;

public class AnswerEvaluatorTests {
    [Theory]
    [InlineData("\u00F6l", "\u00F6l")]
    [InlineData("\u00D6L", "\u00F6l")]
    [InlineData("o\u0308l", "\u00F6l")]
    [InlineData("  \u00D6L  ", "\u00F6l")]
    public void IsAccepted_AcceptsCanonicalCaseAndWhitespaceEquivalents(string submitted, string expected) {
        Assert.True(AnswerEvaluator.IsAccepted(submitted, expected));
    }

    [Fact]
    public void IsAccepted_AcceptsExplicitlyStoredAlternative() {
        Assert.True(AnswerEvaluator.IsAccepted("cafe", "caf\u00E9", "cafe"));
    }

    [Theory]
    [InlineData("ol", "\u00F6l")]
    [InlineData("ovning", "\u00F6vning")]
    [InlineData("var", "v\u00E5r")]
    [InlineData("cafe", "caf\u00E9")]
    [InlineData("bonjour", "bonsoir")]
    public void IsAccepted_RejectsGenuinelyIncorrectAnswers(string submitted, string expected) {
        Assert.False(AnswerEvaluator.IsAccepted(submitted, expected));
    }
}
