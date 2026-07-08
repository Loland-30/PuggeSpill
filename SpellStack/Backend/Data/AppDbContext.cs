using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Models;

namespace SpellStack.Api.Data {
    public class AppDbContext : DbContext {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) {
        }

        public DbSet<Deck> Decks { get; set; }
        public DbSet<Word> Words { get; set; }
        public DbSet<GameSession> GameSessions { get; set; }
        public DbSet<GameRunResult> GameRunResults { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<UserAchievement> UserAchievements { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            modelBuilder.Entity<GameRunResult>()
                .HasIndex(result => result.GameSessionId)
                .IsUnique();
        }
    }
}
