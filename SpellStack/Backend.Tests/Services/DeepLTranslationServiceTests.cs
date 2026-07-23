using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Services;
using Xunit;

namespace SpellStack.Api.Tests.Services;

public class DeepLTranslationServiceTests {
    private const int UserId = 42;

    [Fact]
    public async Task DefaultRequestUsesHeadwordQualityProfile() {
        using var fixture = CreateFixture();

        await fixture.Service.GetTranslation(
            UserId, "Kind", "en", "es", null, null, TestContext.Current.CancellationToken);

        var payload = fixture.Requests.Single();
        Assert.Equal("EN", payload.GetProperty("source_lang").GetString());
        Assert.Equal("ES", payload.GetProperty("target_lang").GetString());
        Assert.Equal("0", payload.GetProperty("split_sentences").GetString());
        Assert.Equal("quality_optimized", payload.GetProperty("model_type").GetString());
        Assert.True(payload.GetProperty("show_billed_characters").GetBoolean());
    }

    [Theory]
    [InlineData("de")]
    [InlineData("en")]
    [InlineData("es")]
    [InlineData("es-419")]
    [InlineData("fr")]
    [InlineData("it")]
    [InlineData("ja")]
    [InlineData("ko")]
    [InlineData("zh")]
    public async Task SupportedTargetsReceiveHeadwordInstructions(string targetLanguage) {
        using var fixture = CreateFixture();

        await fixture.Service.GetTranslation(
            UserId, "vennlig", "no", targetLanguage, null, null, TestContext.Current.CancellationToken);

        var instructions = fixture.Requests.Single()
            .GetProperty("custom_instructions")
            .EnumerateArray()
            .Select(value => value.GetString())
            .ToArray();

        Assert.Contains(
            "Translate the input as a standalone vocabulary headword for a language-learning flashcard.",
            instructions);
        Assert.Contains("Use the indefinite singular form for nouns.", instructions);
        Assert.Contains("Use the infinitive form for verbs.", instructions);
        Assert.Contains("Use the dictionary form for adjectives.", instructions);
    }

    [Fact]
    public async Task NorwegianTargetDoesNotReceiveUnsupportedInstructions() {
        using var fixture = CreateFixture();

        await fixture.Service.GetTranslation(
            UserId, "Easter holiday", "en", "no", null, null, TestContext.Current.CancellationToken);

        Assert.False(fixture.Requests.Single().TryGetProperty("custom_instructions", out _));
    }

    [Fact]
    public async Task ContextIsSentSeparatelyFromSourceText() {
        using var fixture = CreateFixture();
        const string sentence = "She was kind and helpful to everyone.";

        await fixture.Service.GetTranslation(
            UserId, "Kind", "en", "es", sentence, null, TestContext.Current.CancellationToken);

        var payload = fixture.Requests.Single();
        Assert.Equal("Kind", payload.GetProperty("text")[0].GetString());
        Assert.EndsWith(
            $"Additional linguistic context: {sentence}",
            payload.GetProperty("context").GetString());
    }

    [Fact]
    public async Task DifferentContextCreatesDifferentCacheEntries() {
        using var fixture = CreateFixture();

        await fixture.Service.GetTranslation(
            UserId, "Kind", "en", "es", "She was kind.", null, TestContext.Current.CancellationToken);
        await fixture.Service.GetTranslation(
            UserId, "Kind", "en", "es", "What kind is it?", null, TestContext.Current.CancellationToken);

        Assert.Equal(2, fixture.Requests.Count);
        Assert.Equal(2, await fixture.Context.TranslationCacheEntries.CountAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task RegionalSpanishProfileDoesNotReuseTheGenericHeadwordProfile() {
        using var fixture = CreateFixture();
        fixture.Context.TranslationCacheEntries.Add(new TranslationCacheEntry {
            SourceLanguage = "en",
            TargetLanguage = "es",
            ResolvedTargetLanguage = "ES",
            NormalizedSourceText = "KIND",
            NormalizedContext = "",
            RequestProfile = "headword-v2",
            RequestVariant = "default",
            HeadwordInstructionsApplied = true,
            TranslationText = "Tipo"
        });
        await fixture.Context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var result = await fixture.Service.GetTranslation(
            UserId, "Kind", "en", "es", null, null, TestContext.Current.CancellationToken);

        Assert.Single(fixture.Requests);
        Assert.Equal("translated", result!.Text);
        Assert.Equal(2, await fixture.Context.TranslationCacheEntries.CountAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task SpanishVariantsRemainDistinct() {
        using var fixture = CreateFixture();

        await fixture.Service.GetTranslation(
            UserId, "Kind", "en", "es", null, null, TestContext.Current.CancellationToken);
        await fixture.Service.GetTranslation(
            UserId, "Kind", "en", "es-419", null, null, TestContext.Current.CancellationToken);

        Assert.Equal(
            ["ES", "ES-419"],
            fixture.Requests.Select(payload => payload.GetProperty("target_lang").GetString()!).ToArray());
        Assert.Contains(
            "European Spanish as spoken in Spain",
            fixture.Requests[0].GetProperty("context").GetString());
        Assert.Contains(
            "Latin American Spanish",
            fixture.Requests[1].GetProperty("context").GetString());

        var cacheEntries = await fixture.Context.TranslationCacheEntries
            .AsNoTracking()
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Contains(cacheEntries, entry =>
            entry.TargetLanguage == "es" &&
            entry.ResolvedTargetLanguage == "ES");
        Assert.Contains(cacheEntries, entry =>
            entry.TargetLanguage == "es-419" &&
            entry.ResolvedTargetLanguage == "ES-419");
    }

    private static TestFixture CreateFixture() {
        var requests = new List<JsonElement>();
        var handler = new RecordingHandler(async request => {
            var json = await request.Content!.ReadAsStringAsync();
            requests.Add(JsonDocument.Parse(json).RootElement.Clone());
            return new HttpResponseMessage(HttpStatusCode.OK) {
                Content = new StringContent(
                    """
                    {
                      "translations": [
                        {
                          "text": "translated",
                          "detected_source_language": "EN",
                          "billed_characters": 4,
                          "model_type_used": "quality_optimized"
                        }
                      ]
                    }
                    """,
                    Encoding.UTF8,
                    "application/json")
            };
        });
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> {
                ["DEEPL_API_KEY"] = "test-key",
                ["DEEPL_API_BASE_URL"] = "https://deepl.test/v2"
            })
            .Build();
        var service = new DeepLTranslationService(
            context,
            new HttpClient(handler),
            configuration,
            new TranslationRequestLimiter(),
            NullLogger<DeepLTranslationService>.Instance);

        return new TestFixture(context, service, requests);
    }

    private sealed class RecordingHandler(
        Func<HttpRequestMessage, Task<HttpResponseMessage>> handler) : HttpMessageHandler {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) => handler(request);
    }

    private sealed record TestFixture(
        AppDbContext Context,
        DeepLTranslationService Service,
        List<JsonElement> Requests) : IDisposable {
        public void Dispose() => Context.Dispose();
    }
}
