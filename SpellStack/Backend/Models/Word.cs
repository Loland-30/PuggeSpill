namespace LexiGo.Api.Models {
    
    public class Word {
        public int Id { get; set; }
        public string Original { get; set; } = "";
        public string Translation { get; set; } = "";
        public string? AlternativeTranslation { get; set; }
        public string? Hint { get; set; }

        public int DeckId { get; set; }
        public Deck Deck { get; set; } = null!;
    }
}