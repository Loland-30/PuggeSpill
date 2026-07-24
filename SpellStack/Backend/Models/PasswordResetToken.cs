using System.Text.Json.Serialization;

namespace SpellStack.Api.Models {
    public class PasswordResetToken {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CodeHash { get; set; } = "";
        public string CodeSalt { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public int AttemptCount { get; set; }
        public DateTime? SupersededAt { get; set; }
        public string? ResetTokenHash { get; set; }
        public DateTime? ResetTokenExpiresAt { get; set; }
        public DateTime? ResetTokenUsedAt { get; set; }
        public string? RequestIpHash { get; set; }
        public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");

        [JsonIgnore]
        public User User { get; set; } = null!;
    }
}
