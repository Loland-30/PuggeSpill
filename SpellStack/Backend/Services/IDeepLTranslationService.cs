namespace SpellStack.Api.Services {
    public interface IDeepLTranslationService {
        Task<RawTranslationSuggestion?> GetTranslation(
            int userId,
            string text,
            string sourceLanguage,
            string targetLanguage,
            string? linguisticContext,
            string? requestVariant,
            CancellationToken cancellationToken);
    }
}
