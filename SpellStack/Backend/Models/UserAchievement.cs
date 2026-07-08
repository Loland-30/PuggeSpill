using System.Text.Json.Serialization;

namespace SpellStack.Api.Models {
    public class UserAchievement {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string AchievementId { get; set; } = "";
        public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public User? User { get; set; }
    }
}
