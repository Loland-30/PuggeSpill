using System.Text;
using System.Text.Json;

namespace SpellStack.Api.Services {
    public class LexiconEnrichmentService : ILexiconEnrichmentService {
        private const int SupportedSchemaVersion = 1;
        private readonly IReadOnlyDictionary<string, IReadOnlyList<SpanishEntry>> spanishEntries;
        private readonly IReadOnlyDictionary<string, IReadOnlyList<JapaneseEntry>> japaneseEntries;

        public LexiconEnrichmentService(
            IConfiguration configuration,
            ILogger<LexiconEnrichmentService> logger) {
            var root = configuration["Lexicons:Root"];
            if (string.IsNullOrWhiteSpace(root)) {
                root = Path.Combine(AppContext.BaseDirectory, "Data", "Lexicons");
            }

            spanishEntries = LoadLexicon<SpanishEntry>(
                Path.Combine(root, "es-morphology.json"),
                "es",
                NormalizeSpanish,
                logger);
            japaneseEntries = LoadLexicon<JapaneseEntry>(
                Path.Combine(root, "ja-readings.json"),
                "ja",
                NormalizeJapanese,
                logger);
        }

        public IReadOnlyList<TranslationSuggestion> Enrich(
            RawTranslationSuggestion rawSuggestion,
            string targetLanguage) {
            var normalizedTargetLanguage = targetLanguage.Trim().ToLowerInvariant();
            if (normalizedTargetLanguage is "es" or "es-419") {
                return EnrichSpanish(rawSuggestion);
            }
            if (normalizedTargetLanguage == "ja") {
                return EnrichJapanese(rawSuggestion);
            }

            return [ToSuggestion(rawSuggestion)];
        }

        private IReadOnlyList<TranslationSuggestion> EnrichSpanish(
            RawTranslationSuggestion rawSuggestion) {
            var lookupKey = NormalizeSpanish(rawSuggestion.Text);
            if (!spanishEntries.TryGetValue(lookupKey, out var entries)) {
                return [ToSuggestion(rawSuggestion)];
            }

            var variants = entries
                .SelectMany(entry => entry.Variants.Select(variant => (Entry: entry, Variant: variant)))
                .Where(item => string.Equals(item.Variant.Number, "singular", StringComparison.OrdinalIgnoreCase))
                .ToList();
            var primaryMatch = variants.FirstOrDefault(item =>
                NormalizeSpanish(item.Variant.Text) == lookupKey);
            var primaryEntry = primaryMatch.Entry ?? entries.FirstOrDefault();
            var primaryVariant = primaryMatch.Variant;
            var suggestions = new List<TranslationSuggestion> {
                new(
                    rawSuggestion.Text,
                    rawSuggestion.DetectedSourceLanguage,
                    rawSuggestion.Variant,
                    primaryEntry?.PartOfSpeech,
                    primaryVariant?.Gender,
                    primaryVariant?.Number,
                    primaryVariant?.Inferred)
            };
            var seen = new HashSet<string>(StringComparer.Ordinal) { lookupKey };

            foreach (var (entry, variant) in variants) {
                var normalizedVariant = NormalizeSpanish(variant.Text);
                if (string.IsNullOrEmpty(normalizedVariant) || !seen.Add(normalizedVariant)) continue;

                suggestions.Add(new TranslationSuggestion(
                    variant.Text,
                    rawSuggestion.DetectedSourceLanguage,
                    rawSuggestion.Variant,
                    entry.PartOfSpeech,
                    variant.Gender,
                    variant.Number,
                    variant.Inferred));
            }

            return suggestions;
        }

        private IReadOnlyList<TranslationSuggestion> EnrichJapanese(
            RawTranslationSuggestion rawSuggestion) {
            var lookupKey = NormalizeJapanese(rawSuggestion.Text);
            if (!japaneseEntries.TryGetValue(lookupKey, out var entries)) {
                return [ToSuggestion(rawSuggestion)];
            }

            var readings = new List<TranslationReading>();
            var readingIndexes = new Dictionary<string, int>(StringComparer.Ordinal);

            foreach (var reading in entries.SelectMany(entry => entry.Readings)) {
                var normalizedText = NormalizeJapanese(reading.Text);
                if (string.IsNullOrEmpty(normalizedText)) continue;

                var normalizedType = NormalizeReadingType(reading.Type);
                var key = $"{normalizedText}\0{normalizedType}";
                var tags = DeduplicateTags(reading.Tags);
                if (readingIndexes.TryGetValue(key, out var existingIndex)) {
                    var existing = readings[existingIndex];
                    readings[existingIndex] = existing with {
                        Tags = DeduplicateTags(existing.Tags.Concat(tags))
                    };
                    continue;
                }

                readingIndexes[key] = readings.Count;
                readings.Add(new TranslationReading(
                    reading.Text,
                    normalizedType,
                    NormalizeReadingScript(reading.Script),
                    tags));
            }

            return [new TranslationSuggestion(
                rawSuggestion.Text,
                rawSuggestion.DetectedSourceLanguage,
                rawSuggestion.Variant,
                entries.Select(entry => entry.PartOfSpeech).FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)),
                Readings: readings)];
        }

        private static TranslationSuggestion ToSuggestion(RawTranslationSuggestion rawSuggestion) =>
            new(
                rawSuggestion.Text,
                rawSuggestion.DetectedSourceLanguage,
                rawSuggestion.Variant);

        private static IReadOnlyDictionary<string, IReadOnlyList<TEntry>> LoadLexicon<TEntry>(
            string path,
            string expectedLanguage,
            Func<string, string> normalizeKey,
            ILogger logger) {
            try {
                if (!File.Exists(path)) {
                    logger.LogWarning(
                        "Lexicon file {LexiconFile} is missing. Enrichment for {Language} is disabled.",
                        Path.GetFileName(path),
                        expectedLanguage);
                    return new Dictionary<string, IReadOnlyList<TEntry>>();
                }

                using var stream = File.OpenRead(path);
                var document = JsonSerializer.Deserialize<LexiconDocument<TEntry>>(
                    stream,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (document == null ||
                    document.SchemaVersion != SupportedSchemaVersion ||
                    !string.Equals(document.Language, expectedLanguage, StringComparison.OrdinalIgnoreCase)) {
                    logger.LogWarning(
                        "Lexicon file {LexiconFile} has an unsupported schema or language. Enrichment for {Language} is disabled.",
                        Path.GetFileName(path),
                        expectedLanguage);
                    return new Dictionary<string, IReadOnlyList<TEntry>>();
                }

                var normalizedEntries = new Dictionary<string, List<TEntry>>(StringComparer.Ordinal);
                foreach (var (key, entries) in document.Entries) {
                    var normalizedKey = normalizeKey(key);
                    if (string.IsNullOrEmpty(normalizedKey) || entries == null) continue;
                    if (!normalizedEntries.TryGetValue(normalizedKey, out var existing)) {
                        existing = [];
                        normalizedEntries[normalizedKey] = existing;
                    }
                    existing.AddRange(entries);
                }

                return normalizedEntries.ToDictionary(
                    pair => pair.Key,
                    pair => (IReadOnlyList<TEntry>)pair.Value,
                    StringComparer.Ordinal);
            } catch (Exception exception) when (
                exception is IOException or
                UnauthorizedAccessException or
                JsonException or
                NotSupportedException) {
                logger.LogWarning(
                    exception,
                    "Lexicon file {LexiconFile} could not be loaded. Enrichment for {Language} is disabled.",
                    Path.GetFileName(path),
                    expectedLanguage);
                return new Dictionary<string, IReadOnlyList<TEntry>>();
            }
        }

        private static string NormalizeSpanish(string value) =>
            value.Trim().Normalize(NormalizationForm.FormC).ToUpperInvariant();

        private static string NormalizeJapanese(string value) =>
            value.Trim().Normalize(NormalizationForm.FormC);

        private static string NormalizeReadingType(string? value) {
            var normalized = value?.Trim().ToLowerInvariant();
            return normalized is "kun" or "on" ? normalized : "unknown";
        }

        private static string NormalizeReadingScript(string? value) {
            var normalized = value?.Trim().ToLowerInvariant();
            return normalized is "hiragana" or "katakana" ? normalized : "unknown";
        }

        private static IReadOnlyList<string> DeduplicateTags(IEnumerable<string>? tags) {
            if (tags == null) return [];

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            return tags
                .Select(tag => tag.Trim())
                .Where(tag => tag.Length > 0 && seen.Add(tag))
                .ToList();
        }

        private sealed class LexiconDocument<TEntry> {
            public int SchemaVersion { get; set; }
            public string Language { get; set; } = "";
            public Dictionary<string, List<TEntry>> Entries { get; set; } = [];
        }

        private sealed class SpanishEntry {
            public string Word { get; set; } = "";
            public string? PartOfSpeech { get; set; }
            public List<SpanishVariant> Variants { get; set; } = [];
        }

        private sealed class SpanishVariant {
            public string Text { get; set; } = "";
            public string? Gender { get; set; }
            public string? Number { get; set; }
            public bool? Inferred { get; set; }
        }

        private sealed class JapaneseEntry {
            public string Word { get; set; } = "";
            public string? PartOfSpeech { get; set; }
            public List<JapaneseReading> Readings { get; set; } = [];
        }

        private sealed class JapaneseReading {
            public string Text { get; set; } = "";
            public string? Type { get; set; }
            public string? Script { get; set; }
            public List<string> Tags { get; set; } = [];
        }
    }
}
