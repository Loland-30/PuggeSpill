namespace SpellStack.Api.Services {
    public class TranslationSuggestionService {
        private readonly IDeepLTranslationService translationService;
        private readonly ILexiconEnrichmentService lexiconEnrichmentService;

        public TranslationSuggestionService(
            IDeepLTranslationService translationService,
            ILexiconEnrichmentService lexiconEnrichmentService) {
            this.translationService = translationService;
            this.lexiconEnrichmentService = lexiconEnrichmentService;
        }

        public async Task<IReadOnlyList<TranslationSuggestion>> GetSuggestions(
            int userId,
            string text,
            string sourceLanguage,
            string targetLanguage,
            string? linguisticContext,
            string? requestVariant,
            CancellationToken cancellationToken) {
            var rawSuggestion = await translationService.GetTranslation(
                userId,
                text,
                sourceLanguage,
                targetLanguage,
                linguisticContext,
                requestVariant,
                cancellationToken);

            return rawSuggestion == null
                ? []
                : lexiconEnrichmentService.Enrich(rawSuggestion, targetLanguage);
        }
    }
}
