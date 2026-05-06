namespace LexiGo.Api.Models {
    public class User {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string PasswordSalt { get; set; } = "";
        public string FavoriteLanguage { get; set; } = "Spanish";
        public string ThemeJson { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Deck> Decks { get; set; } = new List<Deck>();
        public ICollection<UserAchievement> Achievements { get; set; } = new List<UserAchievement>();
    }
}
