namespace SpellStack.Api.Services {
    public interface ILexiconEnrichmentService {
        IReadOnlyList<TranslationSuggestion> Enrich(
            RawTranslationSuggestion rawSuggestion,
            string targetLanguage);
    }
}
