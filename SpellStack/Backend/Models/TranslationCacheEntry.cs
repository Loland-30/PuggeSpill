namespace SpellStack.Api.Models {
    public class TranslationCacheEntry {
        public int Id { get; set; }
        public string SourceLanguage { get; set; } = "";
        public string TargetLanguage { get; set; } = "";
        public string ResolvedTargetLanguage { get; set; } = "";
        public string NormalizedSourceText { get; set; } = "";
        public string NormalizedContext { get; set; } = "";
        public string RequestProfile { get; set; } = "";
        public string RequestVariant { get; set; } = "default";
        public bool HeadwordInstructionsApplied { get; set; }
        public string TranslationText { get; set; } = "";
        public string? DetectedSourceLanguage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
