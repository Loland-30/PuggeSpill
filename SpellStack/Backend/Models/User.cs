using System.Text.Json.Serialization;

namespace SpellStack.Api.Models {
    public class User {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        [JsonIgnore]
        public string Email { get; set; } = "";
        [JsonIgnore]
        public string PasswordHash { get; set; } = "";
        [JsonIgnore]
        public string PasswordSalt { get; set; } = "";
        [JsonIgnore]
        public bool IsAdmin { get; set; }
        public string FavoriteLanguage { get; set; } = "Spanish";
        public string? Country { get; set; }
        [JsonIgnore]
        public string ThemeJson { get; set; } = "";
        public string? ProfileImageUrl { get; set; }
        [JsonIgnore]
        public string? CustomLoginSplashSoundUrl { get; set; }
        [JsonIgnore]
        public string? CustomMainMenuMusicUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<Deck> Decks { get; set; } = new List<Deck>();
        [JsonIgnore]
        public ICollection<UserAchievement> Achievements { get; set; } = new List<UserAchievement>();
    }
}
