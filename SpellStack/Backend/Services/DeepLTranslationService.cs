using System.Globalization;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;
using SpellStack.Api.Models;

namespace SpellStack.Api.Services {
    public class DeepLTranslationService : IDeepLTranslationService {
        private const int MaximumTextLength = 100;
        private const int MaximumContextLength = 500;
        private const string DefaultRequestProfile = "headword-v2";
        private const string RegionalSpanishRequestProfile = "headword-v3-regional-spanish";
        private const string DefaultVariant = "default";
        private const string MasculineVariant = "masculine-singular";
        private const string FeminineVariant = "feminine-singular";

        private readonly AppDbContext context;
        private readonly HttpClient httpClient;
        private readonly IConfiguration configuration;
        private readonly TranslationRequestLimiter requestLimiter;
        private readonly ILogger<DeepLTranslationService> logger;

        private static readonly Dictionary<string, string> SourceLanguageCodes =
            new(StringComparer.OrdinalIgnoreCase) {
                ["no"] = "NB", ["en"] = "EN", ["es"] = "ES", ["es-419"] = "ES",
                ["ja"] = "JA", ["fr"] = "FR", ["de"] = "DE", ["it"] = "IT",
                ["pt"] = "PT", ["zh"] = "ZH", ["ko"] = "KO", ["ru"] = "RU",
                ["pl"] = "PL", ["nl"] = "NL", ["sv"] = "SV", ["da"] = "DA",
                ["fi"] = "FI", ["tr"] = "TR", ["el"] = "EL", ["id"] = "ID",
                ["uk"] = "UK", ["cs"] = "CS", ["ro"] = "RO", ["hu"] = "HU"
            };

        private static readonly IReadOnlyDictionary<string, string> TargetLanguageCodes =
            new Dictionary<string, string>(SourceLanguageCodes, StringComparer.OrdinalIgnoreCase) {
                ["en"] = "EN-US",
                ["es"] = "ES",
                ["es-419"] = "ES-419",
                ["pt"] = "PT-PT"
            };

        private static readonly IReadOnlyDictionary<string, string> RegionalTargetContexts =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
                ["es"] = "This vocabulary item is intended for learners of European Spanish as spoken in Spain. Prefer the most idiomatic everyday word used in Spain.",
                ["es-419"] = "This vocabulary item is intended for learners of Latin American Spanish. Prefer the most idiomatic everyday word used in Latin America."
            };

        private static readonly IReadOnlyDictionary<string, string?> VariantInstructions =
            new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase) {
                [DefaultVariant] = null,
                [MasculineVariant] = "Use the masculine singular grammatical form where applicable.",
                [FeminineVariant] = "Use the feminine singular grammatical form where applicable."
            };

        private static readonly HashSet<string> HeadwordInstructionTargets =
            new(StringComparer.OrdinalIgnoreCase) {
                "de", "en", "es", "es-419", "fr", "it", "ja", "ko", "zh"
            };

        private static readonly string[] HeadwordInstructions = [
            "Translate the input as a standalone vocabulary headword for a language-learning flashcard.",
            "Use the indefinite singular form for nouns.",
            "Use the infinitive form for verbs.",
            "Use the dictionary form for adjectives."
        ];

        public DeepLTranslationService(
            AppDbContext context,
            HttpClient httpClient,
            IConfiguration configuration,
            TranslationRequestLimiter requestLimiter,
            ILogger<DeepLTranslationService> logger) {
            this.context = context;
            this.httpClient = httpClient;
            this.configuration = configuration;
            this.requestLimiter = requestLimiter;
            this.logger = logger;
        }

        public async Task<RawTranslationSuggestion?> GetTranslation(
            int userId,
            string text,
            string sourceLanguage,
            string targetLanguage,
            string? linguisticContext,
            string? requestVariant,
            CancellationToken cancellationToken) {
            var trimmedText = text.Trim();
            var trimmedContext = linguisticContext?.Trim() ?? "";
            var normalizedSourceLanguage = sourceLanguage.Trim().ToLowerInvariant();
            var normalizedTargetLanguage = targetLanguage.Trim().ToLowerInvariant();
            var normalizedVariant = string.IsNullOrWhiteSpace(requestVariant)
                ? DefaultVariant
                : requestVariant.Trim().ToLowerInvariant();

            if (trimmedText.Length < 2 || trimmedText.Length > MaximumTextLength) {
                throw new TranslationServiceException("invalid_request", "Text must contain between 2 and 100 characters.");
            }
            if (trimmedContext.Length > MaximumContextLength) {
                throw new TranslationServiceException("invalid_request", "Context must not exceed 500 characters.");
            }
            if (normalizedSourceLanguage == normalizedTargetLanguage) {
                throw new TranslationServiceException("invalid_request", "Source and target languages must be different.");
            }
            if (!VariantInstructions.TryGetValue(normalizedVariant, out var customInstruction)) {
                throw new TranslationServiceException("invalid_request", "Unknown translation request variant.");
            }
            if (normalizedVariant != DefaultVariant &&
                normalizedTargetLanguage is not ("es" or "es-419")) {
                throw new TranslationServiceException("unsupported_language_pair", "Grammatical forms are currently supported for Spanish targets only.");
            }
            if (!SourceLanguageCodes.TryGetValue(normalizedSourceLanguage, out var providerSourceLanguage) ||
                !TargetLanguageCodes.TryGetValue(normalizedTargetLanguage, out var providerTargetLanguage)) {
                throw new TranslationServiceException("unsupported_language_pair", "This language pair is not supported by translation suggestions.");
            }

            var normalizedText = NormalizeValue(trimmedText);
            var normalizedContext = NormalizeValue(trimmedContext);
            var applyHeadwordInstructions = HeadwordInstructionTargets.Contains(normalizedTargetLanguage);
            var requestProfile = RegionalTargetContexts.ContainsKey(normalizedTargetLanguage)
                ? RegionalSpanishRequestProfile
                : DefaultRequestProfile;
            var cached = await context.TranslationCacheEntries
                .AsNoTracking()
                .FirstOrDefaultAsync(entry =>
                    entry.SourceLanguage == normalizedSourceLanguage &&
                    entry.ResolvedTargetLanguage == providerTargetLanguage &&
                    entry.NormalizedSourceText == normalizedText &&
                    entry.NormalizedContext == normalizedContext &&
                    entry.RequestProfile == requestProfile &&
                    entry.HeadwordInstructionsApplied == applyHeadwordInstructions &&
                    entry.RequestVariant == normalizedVariant,
                    cancellationToken);
            if (cached != null) {
                return new RawTranslationSuggestion(
                    cached.TranslationText,
                    cached.DetectedSourceLanguage,
                    cached.RequestVariant);
            }

            var apiKey = configuration["DEEPL_API_KEY"];
            if (string.IsNullOrWhiteSpace(apiKey)) {
                throw new TranslationServiceException("not_configured", "Translation suggestions are not configured.");
            }
            if (!requestLimiter.TryConsume(userId)) {
                throw new TranslationServiceException("rate_limited", "Too many translation requests.");
            }

            var baseUrl = configuration["DEEPL_API_BASE_URL"];
            if (string.IsNullOrWhiteSpace(baseUrl)) baseUrl = "https://api-free.deepl.com/v2";

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl.TrimEnd('/')}/translate");
            request.Headers.TryAddWithoutValidation("Authorization", $"DeepL-Auth-Key {apiKey.Trim()}");
            var customInstructions = applyHeadwordInstructions
                ? HeadwordInstructions.ToList()
                : [];
            if (customInstruction != null) customInstructions.Add(customInstruction);
            var providerContext = BuildProviderContext(normalizedTargetLanguage, trimmedContext);

            request.Content = JsonContent.Create(new DeepLRequest {
                Text = [trimmedText],
                SourceLanguage = providerSourceLanguage,
                TargetLanguage = providerTargetLanguage,
                Context = providerContext,
                SplitSentences = "0",
                ModelType = "quality_optimized",
                ShowBilledCharacters = true,
                CustomInstructions = customInstructions.Count == 0 ? null : customInstructions
            });

            try {
                using var response = await httpClient.SendAsync(request, cancellationToken);
                if ((int)response.StatusCode == 429) {
                    throw new TranslationServiceException("rate_limited", "The translation provider rate limit was reached.");
                }
                if (!response.IsSuccessStatusCode) {
                    logger.LogWarning(
                        "DeepL request failed with status {StatusCode} for variant {RequestVariant}.",
                        (int)response.StatusCode,
                        normalizedVariant);
                    throw new TranslationServiceException("provider_unavailable", "Translation suggestions are temporarily unavailable.");
                }

                await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                var providerResponse = await JsonSerializer.DeserializeAsync<DeepLResponse>(
                    responseStream,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                    cancellationToken);
                var translation = providerResponse?.Translations?.FirstOrDefault();
                if (translation == null || string.IsNullOrWhiteSpace(translation.Text)) return null;

                logger.LogDebug(
                    "DeepL translation completed with model {ModelTypeUsed}, {BilledCharacters} billed characters, profile {RequestProfile}.",
                    translation.ModelTypeUsed ?? "unknown",
                    translation.BilledCharacters,
                    requestProfile);

                var result = new RawTranslationSuggestion(
                    translation.Text.Trim(),
                    translation.DetectedSourceLanguage?.Trim().ToLowerInvariant(),
                    normalizedVariant);
                context.TranslationCacheEntries.Add(new TranslationCacheEntry {
                    SourceLanguage = normalizedSourceLanguage,
                    TargetLanguage = normalizedTargetLanguage,
                    ResolvedTargetLanguage = providerTargetLanguage,
                    NormalizedSourceText = normalizedText,
                    NormalizedContext = normalizedContext,
                    RequestProfile = requestProfile,
                    RequestVariant = normalizedVariant,
                    HeadwordInstructionsApplied = applyHeadwordInstructions,
                    TranslationText = result.Text,
                    DetectedSourceLanguage = result.DetectedSourceLanguage
                });

                try {
                    await context.SaveChangesAsync(cancellationToken);
                } catch (DbUpdateException) {
                    // A concurrent request may have populated the same unique cache key.
                    context.ChangeTracker.Clear();
                }

                return result;
            } catch (TranslationServiceException) {
                throw;
            } catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested) {
                throw new TranslationServiceException("provider_unavailable", "The translation provider timed out.");
            } catch (HttpRequestException exception) {
                logger.LogWarning(exception, "DeepL request could not be completed.");
                throw new TranslationServiceException("provider_unavailable", "Translation suggestions are temporarily unavailable.");
            } catch (JsonException exception) {
                logger.LogWarning(exception, "DeepL returned an invalid response.");
                throw new TranslationServiceException("provider_unavailable", "Translation suggestions are temporarily unavailable.");
            }
        }

        private static string NormalizeValue(string value) =>
            value.Normalize(NormalizationForm.FormKC).ToUpper(CultureInfo.InvariantCulture);

        private static string? BuildProviderContext(string targetLanguage, string linguisticContext) {
            RegionalTargetContexts.TryGetValue(targetLanguage, out var regionalContext);

            if (string.IsNullOrEmpty(regionalContext)) {
                return string.IsNullOrEmpty(linguisticContext) ? null : linguisticContext;
            }

            return string.IsNullOrEmpty(linguisticContext)
                ? regionalContext
                : $"{regionalContext}\n\nAdditional linguistic context: {linguisticContext}";
        }

        private sealed class DeepLRequest {
            [JsonPropertyName("text")]
            public required List<string> Text { get; init; }

            [JsonPropertyName("source_lang")]
            public required string SourceLanguage { get; init; }

            [JsonPropertyName("target_lang")]
            public required string TargetLanguage { get; init; }

            [JsonPropertyName("context")]
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            public string? Context { get; init; }

            [JsonPropertyName("split_sentences")]
            public required string SplitSentences { get; init; }

            [JsonPropertyName("model_type")]
            public required string ModelType { get; init; }

            [JsonPropertyName("show_billed_characters")]
            public required bool ShowBilledCharacters { get; init; }

            [JsonPropertyName("custom_instructions")]
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            public List<string>? CustomInstructions { get; init; }
        }

        private sealed class DeepLResponse {
            public List<DeepLTranslation>? Translations { get; set; }
        }

        private sealed class DeepLTranslation {
            public string Text { get; set; } = "";

            [JsonPropertyName("detected_source_language")]
            public string? DetectedSourceLanguage { get; set; }

            [JsonPropertyName("billed_characters")]
            public int? BilledCharacters { get; set; }

            [JsonPropertyName("model_type_used")]
            public string? ModelTypeUsed { get; set; }
        }
    }

    public class TranslationServiceException : Exception {
        public TranslationServiceException(string code, string message) : base(message) {
            Code = code;
        }

        public string Code { get; }
    }
}
