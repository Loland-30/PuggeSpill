using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;
using SpellStack.Api.Models;

namespace SpellStack.Api.Services {
    public class DeepLTranslationService {
        private const int MaximumTextLength = 100;
        private readonly AppDbContext context;
        private readonly HttpClient httpClient;
        private readonly IConfiguration configuration;
        private readonly TranslationRequestLimiter requestLimiter;
        private readonly ILogger<DeepLTranslationService> logger;

        private static readonly Dictionary<string, string> SourceLanguageCodes =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
                ["no"] = "NB", ["en"] = "EN", ["es"] = "ES", ["ja"] = "JA",
                ["fr"] = "FR", ["de"] = "DE", ["it"] = "IT", ["pt"] = "PT",
                ["zh"] = "ZH", ["ko"] = "KO", ["ru"] = "RU", ["pl"] = "PL",
                ["nl"] = "NL", ["sv"] = "SV", ["da"] = "DA", ["fi"] = "FI",
                ["tr"] = "TR", ["el"] = "EL", ["id"] = "ID", ["uk"] = "UK",
                ["cs"] = "CS", ["ro"] = "RO", ["hu"] = "HU"
            };

        private static readonly IReadOnlyDictionary<string, string> TargetLanguageCodes =
            new Dictionary<string, string>(SourceLanguageCodes, StringComparer.OrdinalIgnoreCase) {
                ["en"] = "EN-US",
                ["pt"] = "PT-PT"
            };

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

        public async Task<IReadOnlyList<TranslationSuggestion>> GetSuggestions(
            int userId,
            string text,
            string sourceLanguage,
            string targetLanguage,
            CancellationToken cancellationToken) {
            var trimmedText = text.Trim();
            var normalizedSourceLanguage = sourceLanguage.Trim().ToLowerInvariant();
            var normalizedTargetLanguage = targetLanguage.Trim().ToLowerInvariant();

            if (trimmedText.Length < 2 || trimmedText.Length > MaximumTextLength) {
                throw new TranslationServiceException("invalid_request", "Text must contain between 2 and 100 characters.");
            }
            if (normalizedSourceLanguage == normalizedTargetLanguage) {
                throw new TranslationServiceException("invalid_request", "Source and target languages must be different.");
            }
            if (!SourceLanguageCodes.TryGetValue(normalizedSourceLanguage, out var providerSourceLanguage) ||
                !TargetLanguageCodes.TryGetValue(normalizedTargetLanguage, out var providerTargetLanguage)) {
                throw new TranslationServiceException("unsupported_language_pair", "This language pair is not supported by translation suggestions.");
            }

            var normalizedText = NormalizeText(trimmedText);
            var cached = await context.TranslationCacheEntries
                .AsNoTracking()
                .FirstOrDefaultAsync(entry =>
                    entry.SourceLanguage == normalizedSourceLanguage &&
                    entry.TargetLanguage == normalizedTargetLanguage &&
                    entry.NormalizedSourceText == normalizedText,
                    cancellationToken);
            if (cached != null) {
                return [new TranslationSuggestion(cached.TranslationText, cached.DetectedSourceLanguage)];
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
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string> {
                ["text"] = trimmedText,
                ["source_lang"] = providerSourceLanguage,
                ["target_lang"] = providerTargetLanguage
            });

            try {
                using var response = await httpClient.SendAsync(request, cancellationToken);
                if ((int)response.StatusCode == 429) {
                    throw new TranslationServiceException("rate_limited", "The translation provider rate limit was reached.");
                }
                if (!response.IsSuccessStatusCode) {
                    logger.LogWarning("DeepL request failed with status {StatusCode}.", (int)response.StatusCode);
                    throw new TranslationServiceException("provider_unavailable", "Translation suggestions are temporarily unavailable.");
                }

                await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                var providerResponse = await JsonSerializer.DeserializeAsync<DeepLResponse>(
                    responseStream,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                    cancellationToken);
                var translation = providerResponse?.Translations?.FirstOrDefault();
                if (translation == null || string.IsNullOrWhiteSpace(translation.Text)) return [];

                var result = new TranslationSuggestion(
                    translation.Text.Trim(),
                    translation.DetectedSourceLanguage?.Trim().ToLowerInvariant());
                context.TranslationCacheEntries.Add(new TranslationCacheEntry {
                    SourceLanguage = normalizedSourceLanguage,
                    TargetLanguage = normalizedTargetLanguage,
                    NormalizedSourceText = normalizedText,
                    TranslationText = result.Text,
                    DetectedSourceLanguage = result.DetectedSourceLanguage
                });

                try {
                    await context.SaveChangesAsync(cancellationToken);
                } catch (DbUpdateException) {
                    // A concurrent request may have populated the same unique cache key.
                    context.ChangeTracker.Clear();
                }

                return [result];
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

        private static string NormalizeText(string value) =>
            value.Normalize(NormalizationForm.FormKC).ToUpper(CultureInfo.InvariantCulture);

        private sealed class DeepLResponse {
            public List<DeepLTranslation>? Translations { get; set; }
        }

        private sealed class DeepLTranslation {
            public string Text { get; set; } = "";
            [JsonPropertyName("detected_source_language")]
            public string? DetectedSourceLanguage { get; set; }
        }
    }

    public record TranslationSuggestion(string Text, string? DetectedSourceLanguage);

    public class TranslationServiceException : Exception {
        public TranslationServiceException(string code, string message) : base(message) {
            Code = code;
        }

        public string Code { get; }
    }
}
