namespace LexiGo.Api.Models {
    public class UserAchievement {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string AchievementId { get; set; } = "";
        public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}
