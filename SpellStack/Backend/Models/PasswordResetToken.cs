namespace LexiGo.Api.Models {
    public class PasswordResetToken {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string TokenHash { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }

        public User User { get; set; } = null!;
    }
}
