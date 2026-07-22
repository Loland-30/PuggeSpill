using System.Text.Json.Serialization;

namespace SpellStack.Api.Models {
    
    public class Deck {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = "";
        public string Language { get; set; } = "";
        public string TranslationLanguage { get; set; } = "";
        public string LearningLanguage { get; set; } = "";
        public string Description { get; set; } = "";
        public int HighScore { get; set; }
        public int ContentRevision { get; set; } = 1;
        public int? TrialResultRevision { get; set; }
        public int BestTrialStars { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Word> Words { get; set; } = new List<Word>();
        [JsonIgnore]
        public User? User { get; set; }
    }
}
