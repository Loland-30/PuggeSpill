namespace SpellStack.Api.Services {
    public record RawTranslationSuggestion(
        string Text,
        string? DetectedSourceLanguage,
        string Variant);

    public record TranslationReading(
        string Text,
        string Type,
        string Script,
        IReadOnlyList<string> Tags,
        string? Source = null,
        string? Confidence = null,
        string? Romanization = null);

    public record TranslationSuggestion(
        string Text,
        string? DetectedSourceLanguage,
        string Variant,
        string? PartOfSpeech = null,
        string? Gender = null,
        string? Number = null,
        bool? Inferred = null,
        IReadOnlyList<TranslationReading>? Readings = null,
        string? Romanization = null);
}
