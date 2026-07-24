using System.Net;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using SpellStack.Api.Data;
using SpellStack.Api.Services;
using Xunit;

namespace SpellStack.Api.Tests.Services;

public class LexiconEnrichmentServiceTests {
    [Fact]
    public void SpanishLookupReturnsMasculineAndFeminineSingularForms() {
        var service = CreateService();

        var suggestions = service.Enrich(Raw("cansado"), "es");

        Assert.Equal(["cansado", "cansada"], suggestions.Select(suggestion => suggestion.Text));
        Assert.Equal(["masculine", "feminine"], suggestions.Select(suggestion => suggestion.Gender));
        Assert.All(suggestions, suggestion => Assert.Equal("singular", suggestion.Number));
    }

    [Theory]
    [InlineData("enfadado", "es", "enfadada")]
    [InlineData("enojado", "es-419", "enojada")]
    public void SpanishRegionalResultsUseTheSharedMorphologyIndex(
        string masculine,
        string targetLanguage,
        string feminine) {
        var service = CreateService();

        var suggestions = service.Enrich(Raw(masculine), targetLanguage);

        Assert.Equal([masculine, feminine], suggestions.Select(suggestion => suggestion.Text));
    }

    [Fact]
    public void SpanishLookupDeduplicatesDocumentedFormsAndIgnoresPluralForms() {
        var service = CreateService();

        var suggestions = service.Enrich(Raw("cansado"), "es-419");

        Assert.Equal(2, suggestions.Count);
        Assert.Single(suggestions, suggestion => suggestion.Text == "cansada");
        Assert.DoesNotContain(suggestions, suggestion => suggestion.Text == "cansados");
    }

    [Fact]
    public void SpanishNoMatchReturnsOnlyRawSuggestion() {
        var service = CreateService();

        var suggestions = service.Enrich(Raw("interesante"), "es");

        var suggestion = Assert.Single(suggestions);
        Assert.Equal("interesante", suggestion.Text);
        Assert.Null(suggestion.Gender);
    }

    [Fact]
    public void JapaneseLookupAttachesReadingsToTheSameSuggestion() {
        var service = CreateService();

        var suggestions = service.Enrich(Raw("冬"), "ja");

        var suggestion = Assert.Single(suggestions);
        Assert.Equal("冬", suggestion.Text);
        Assert.Equal("noun", suggestion.PartOfSpeech);
        Assert.Equal(["ふゆ", "トウ"], suggestion.Readings!.Select(reading => reading.Text));
        Assert.Equal(["kun", "on"], suggestion.Readings!.Select(reading => reading.Type));
        Assert.All(suggestion.Readings!, reading => Assert.Equal("forms", reading.Source));
        Assert.All(suggestion.Readings!, reading => Assert.Equal("structured", reading.Confidence));
        Assert.Equal(["fuyu", "tou"], suggestion.Readings!.Select(reading => reading.Romanization));
    }

    [Fact]
    public void JapaneseLookupMergesDuplicateReadingsAndTags() {
        var service = CreateService();

        var suggestion = Assert.Single(service.Enrich(Raw("冬"), "ja"));
        var onReading = Assert.Single(suggestion.Readings!, reading => reading.Type == "on");

        Assert.Equal(["go-on", "joyo", "kan-on"], onReading.Tags);
        Assert.Equal(onReading.Tags.Count, onReading.Tags.Distinct(StringComparer.OrdinalIgnoreCase).Count());
    }

    [Fact]
    public void JapaneseReadingsRetainTheirOwnRomanization() {
        var suggestion = Assert.Single(CreateService().Enrich(Raw("明日"), "ja"));

        Assert.Equal(
            [("みょうにち", "myounichi"), ("あす", "asu"), ("あした", "ashita")],
            suggestion.Readings!.Select(reading => (reading.Text, reading.Romanization)));
    }

    [Fact]
    public void JapaneseMissingStructuredRomajiUsesSafeKanaFallback() {
        var suggestion = Assert.Single(CreateService().Enrich(Raw("食べる"), "ja"));
        var reading = Assert.Single(suggestion.Readings!);

        Assert.Equal("たべる", reading.Text);
        Assert.Equal("taberu", reading.Romanization);
    }

    [Theory]
    [InlineData("먹다", "meokda")]
    [InlineData("학교", "hakgyo")]
    [InlineData("사랑", "sarang")]
    [InlineData("컴퓨터", "keompyuteo")]
    public void KoreanLookupAttachesPreferredRomanization(string word, string expected) {
        var suggestion = Assert.Single(CreateService().Enrich(Raw(word), "ko"));

        Assert.Equal(word, suggestion.Text);
        Assert.Equal(expected, suggestion.Romanization);
        Assert.Null(suggestion.Readings);
    }

    [Fact]
    public void KoreanNoMatchReturnsRawSuggestionWithoutDuplicates() {
        var suggestions = CreateService().Enrich(Raw("없는단어"), "ko");

        var suggestion = Assert.Single(suggestions);
        Assert.Equal("없는단어", suggestion.Text);
        Assert.Equal("eomneundaneo", suggestion.Romanization);
    }

    [Theory]
    [InlineData("달콤한", "dalkomhan")]
    [InlineData("자동차 회사", "jadongcha hoesa")]
    public void KoreanNoMatchUsesGeneratedRomanization(string word, string expected) {
        var suggestion = Assert.Single(CreateService().Enrich(Raw(word), "ko"));

        Assert.Equal(word, suggestion.Text);
        Assert.Equal(expected, suggestion.Romanization);
    }

    [Fact]
    public void KoreanExactLexiconResultTakesPrecedenceOverFallback() {
        var romanizer = new StubKoreanRomanizer("generated-value");
        var suggestion = Assert.Single(CreateService(koreanRomanizer: romanizer)
            .Enrich(Raw("먹다"), "ko"));

        Assert.Equal("meokda", suggestion.Romanization);
        Assert.Equal(0, romanizer.CallCount);
    }

    [Theory]
    [InlineData("달콤한", "dalkomhan")]
    [InlineData("자동차 회사", "jadongcha hoesa")]
    [InlineData("K-pop 음악!", "K-pop eumak!")]
    [InlineData("2026년", "2026nyeon")]
    [InlineData("USB 케이블", "USB keibeul")]
    [InlineData("먹어", "meogeo")]
    [InlineData("국물", "gungmul")]
    [InlineData("설날", "seollal")]
    [InlineData("같이", "gachi")]
    public void KoreanRomanizerHandlesWordsSpacingPunctuationAndMixedText(
        string text,
        string expected) {
        Assert.Equal(expected, new KoreanRomanizer().TryRomanize(text));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("K-pop 2026")]
    public void KoreanRomanizerDoesNotProduceBogusOutputWithoutHangul(string text) {
        Assert.Null(new KoreanRomanizer().TryRomanize(text));
    }

    [Fact]
    public void KoreanNonHangulNoMatchKeepsTheNormalSuggestion() {
        var suggestion = Assert.Single(CreateService().Enrich(Raw("K-pop 2026"), "ko"));

        Assert.Equal("K-pop 2026", suggestion.Text);
        Assert.Null(suggestion.Romanization);
    }

    [Fact]
    public void UnsupportedEnrichmentLanguageReturnsRawSuggestionUnchanged() {
        var service = CreateService();
        var raw = Raw("fatigué");

        var suggestion = Assert.Single(service.Enrich(raw, "fr"));

        Assert.Equal(raw.Text, suggestion.Text);
        Assert.Equal(raw.Variant, suggestion.Variant);
        Assert.Null(suggestion.Readings);
    }

    [Fact]
    public void MissingLexiconFilesDoNotBlockTranslations() {
        var logger = new CollectingLogger<LexiconEnrichmentService>();
        var service = CreateService(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString()), logger);

        var suggestion = Assert.Single(service.Enrich(Raw("cansado"), "es"));

        Assert.Equal("cansado", suggestion.Text);
        Assert.Contains(logger.Levels, level => level == LogLevel.Warning);
    }

    [Fact]
    public void MalformedLexiconFileDoesNotBlockTranslations() {
        using var directory = new TemporaryDirectory();
        File.WriteAllText(Path.Combine(directory.Path, "es-morphology.json"), "{not valid json");
        var logger = new CollectingLogger<LexiconEnrichmentService>();
        var service = CreateService(directory.Path, logger);

        var suggestion = Assert.Single(service.Enrich(Raw("cansado"), "es"));

        Assert.Equal("cansado", suggestion.Text);
        Assert.Contains(logger.Levels, level => level == LogLevel.Warning);
    }

    [Fact]
    public async Task CachedDeepLResultIsStillEnriched() {
        var requests = 0;
        var handler = new StubHandler(_ => {
            requests++;
            return new HttpResponseMessage(HttpStatusCode.OK) {
                Content = new StringContent(
                    """
                    {
                      "translations": [
                        {
                          "text": "cansado",
                          "detected_source_language": "EN",
                          "billed_characters": 5,
                          "model_type_used": "quality_optimized"
                        }
                      ]
                    }
                    """,
                    Encoding.UTF8,
                    "application/json")
            };
        });
        await using var context = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
        var configuration = Configuration(FixtureRoot(), new Dictionary<string, string?> {
            ["DEEPL_API_KEY"] = "test-key",
            ["DEEPL_API_BASE_URL"] = "https://deepl.test/v2"
        });
        var deepL = new DeepLTranslationService(
            context,
            new HttpClient(handler),
            configuration,
            new TranslationRequestLimiter(),
            NullLogger<DeepLTranslationService>.Instance);
        var suggestions = new TranslationSuggestionService(
            deepL,
            new LexiconEnrichmentService(
                configuration,
                NullLogger<LexiconEnrichmentService>.Instance,
                new KoreanRomanizer()));

        var first = await suggestions.GetSuggestions(
            7, "Tired", "en", "es", null, null, TestContext.Current.CancellationToken);
        var cached = await suggestions.GetSuggestions(
            7, "Tired", "en", "es", null, null, TestContext.Current.CancellationToken);

        Assert.Equal(1, requests);
        Assert.Equal(["cansado", "cansada"], first.Select(suggestion => suggestion.Text));
        Assert.Equal(["cansado", "cansada"], cached.Select(suggestion => suggestion.Text));
    }

    [Fact]
    public async Task CachedKoreanDeepLResultStillReceivesGeneratedRomanization() {
        var requests = 0;
        var handler = new StubHandler(_ => {
            requests++;
            return new HttpResponseMessage(HttpStatusCode.OK) {
                Content = new StringContent(
                    """
                    {
                      "translations": [
                        {
                          "text": "달콤한",
                          "detected_source_language": "EN",
                          "billed_characters": 5,
                          "model_type_used": "quality_optimized"
                        }
                      ]
                    }
                    """,
                    Encoding.UTF8,
                    "application/json")
            };
        });
        await using var context = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
        var configuration = Configuration(FixtureRoot(), new Dictionary<string, string?> {
            ["DEEPL_API_KEY"] = "test-key",
            ["DEEPL_API_BASE_URL"] = "https://deepl.test/v2"
        });
        var deepL = new DeepLTranslationService(
            context,
            new HttpClient(handler),
            configuration,
            new TranslationRequestLimiter(),
            NullLogger<DeepLTranslationService>.Instance);
        var suggestions = new TranslationSuggestionService(
            deepL,
            new LexiconEnrichmentService(
                configuration,
                NullLogger<LexiconEnrichmentService>.Instance,
                new KoreanRomanizer()));

        var first = await suggestions.GetSuggestions(
            7, "Sweet", "en", "ko", null, null, TestContext.Current.CancellationToken);
        var cached = await suggestions.GetSuggestions(
            7, "Sweet", "en", "ko", null, null, TestContext.Current.CancellationToken);

        Assert.Equal(1, requests);
        Assert.Equal("dalkomhan", Assert.Single(first).Romanization);
        Assert.Equal("dalkomhan", Assert.Single(cached).Romanization);
    }

    [Fact]
    public void UnicodeEquivalentSpanishLookupKeysResolve() {
        var service = CreateService();
        var decomposed = "ra\u0301pido";

        var suggestions = service.Enrich(Raw(decomposed), "es");

        Assert.Equal(decomposed, suggestions[0].Text);
        Assert.Contains(suggestions, suggestion => suggestion.Text == "rápida");
    }

    private static RawTranslationSuggestion Raw(string text) =>
        new(text, "en", "default");

    private static LexiconEnrichmentService CreateService(
        string? root = null,
        ILogger<LexiconEnrichmentService>? logger = null,
        IKoreanRomanizer? koreanRomanizer = null) =>
        new(
            Configuration(root ?? FixtureRoot()),
            logger ?? NullLogger<LexiconEnrichmentService>.Instance,
            koreanRomanizer ?? new KoreanRomanizer());

    private static IConfiguration Configuration(
        string root,
        IReadOnlyDictionary<string, string?>? additional = null) {
        var values = new Dictionary<string, string?> {
            ["Lexicons:Root"] = root
        };
        if (additional != null) {
            foreach (var (key, value) in additional) values[key] = value;
        }
        return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    }

    private static string FixtureRoot() =>
        Path.Combine(AppContext.BaseDirectory, "Fixtures", "Lexicons");

    private sealed class StubHandler(
        Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(handler(request));
    }

    private sealed class CollectingLogger<T> : ILogger<T> {
        public List<LogLevel> Levels { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull =>
            NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) =>
            Levels.Add(logLevel);
    }

    private sealed class StubKoreanRomanizer(string? result) : IKoreanRomanizer {
        public int CallCount { get; private set; }

        public string? TryRomanize(string? text) {
            CallCount++;
            return result;
        }
    }

    private sealed class NullScope : IDisposable {
        public static readonly NullScope Instance = new();
        public void Dispose() { }
    }

    private sealed class TemporaryDirectory : IDisposable {
        public TemporaryDirectory() {
            Path = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(),
                $"spellstack-lexicon-tests-{Guid.NewGuid():N}");
            Directory.CreateDirectory(Path);
        }

        public string Path { get; }

        public void Dispose() {
            if (Directory.Exists(Path)) Directory.Delete(Path, recursive: true);
        }
    }
}
