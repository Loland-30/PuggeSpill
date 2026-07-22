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
        public DbSet<UpdatePost> UpdatePosts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            modelBuilder.Entity<GameRunResult>()
                .HasIndex(result => result.GameSessionId)
                .IsUnique();

            modelBuilder.Entity<UpdatePost>(entity => {
                entity.HasIndex(post => post.Slug).IsUnique();
                entity.Property(post => post.Slug).HasMaxLength(160);
                entity.Property(post => post.Version).HasMaxLength(32);
                entity.Property(post => post.Title).HasMaxLength(180);
                entity.Property(post => post.Summary).HasMaxLength(500);
                entity.Property(post => post.Category).HasMaxLength(64);
                entity.Property(post => post.Status).HasMaxLength(64);

                entity.HasData(
                    new UpdatePost {
                        Id = 1,
                        Slug = "v0-1-0-early-spellstack-build",
                        Version = "v0.1.0",
                        Title = "Early SpellStack Build",
                        Summary = "Initial playable SpellStack build with accounts, decks and gameplay.",
                        Content = "SpellStack's first playable release established the core vocabulary-practice experience.\n\n- Account and profile flow\n- Custom vocabulary decks\n- Core quiz and battle gameplay loop\n- Themes and settings\n- Production deployment foundation",
                        Category = "Core",
                        Status = "Live",
                        IsPublished = true,
                        PublishedAt = new DateTime(2026, 7, 1, 10, 0, 0, DateTimeKind.Utc),
                        CreatedAt = new DateTime(2026, 7, 1, 10, 0, 0, DateTimeKind.Utc),
                        UpdatedAt = new DateTime(2026, 7, 1, 10, 0, 0, DateTimeKind.Utc)
                    },
                    new UpdatePost {
                        Id = 2,
                        Slug = "v0-1-5-theme-ui-polish",
                        Version = "v0.1.5",
                        Title = "Theme & UI Polish",
                        Summary = "Improved visual polish and theme behavior across SpellStack.",
                        Content = "This release made themes more dependable and the interface easier to read across different backgrounds.\n\n- Adjusted default theme behavior\n- Improved gradient and solid theme support\n- More reliable custom background loading\n- Continued UI readability polish",
                        Category = "Polish",
                        Status = "Live",
                        IsPublished = true,
                        PublishedAt = new DateTime(2026, 7, 9, 10, 0, 0, DateTimeKind.Utc),
                        CreatedAt = new DateTime(2026, 7, 9, 10, 0, 0, DateTimeKind.Utc),
                        UpdatedAt = new DateTime(2026, 7, 9, 10, 0, 0, DateTimeKind.Utc)
                    },
                    new UpdatePost {
                        Id = 3,
                        Slug = "v0-2-0-responsive-design",
                        Version = "v0.2.0",
                        Title = "Responsive Design",
                        Summary = "Improved SpellStack across desktop, tablet and mobile layouts.",
                        Content = "SpellStack now adapts more intentionally to the screen it is played on.\n\n- Responsive layouts for desktop, tablet and mobile\n- Improved navigation across screen sizes\n- Profile, deck and gameplay layout polish\n- Better mobile gameplay readability and usability",
                        Category = "Responsive",
                        Status = "Live",
                        IsPublished = true,
                        PublishedAt = new DateTime(2026, 7, 14, 10, 0, 0, DateTimeKind.Utc),
                        CreatedAt = new DateTime(2026, 7, 14, 10, 0, 0, DateTimeKind.Utc),
                        UpdatedAt = new DateTime(2026, 7, 14, 10, 0, 0, DateTimeKind.Utc)
                    },
                    new UpdatePost {
                        Id = 4,
                        Slug = "v0-3-0-realtime-multiplayer-lobby",
                        Version = "v0.3.0",
                        Title = "Realtime Multiplayer Lobby",
                        Summary = "Added the first realtime multiplayer foundation to SpellStack.",
                        Content = "The multiplayer lobby now has a real realtime foundation while keeping gameplay setup familiar.\n\n- Private rooms with shareable room codes\n- Live player list and ready state\n- SignalR room communication\n- Leave and reconnect-aware room handling",
                        Category = "Multiplayer",
                        Status = "Live",
                        IsPublished = true,
                        PublishedAt = new DateTime(2026, 7, 15, 10, 0, 0, DateTimeKind.Utc),
                        CreatedAt = new DateTime(2026, 7, 15, 10, 0, 0, DateTimeKind.Utc),
                        UpdatedAt = new DateTime(2026, 7, 15, 10, 0, 0, DateTimeKind.Utc)
                    }
                );
            });
        }
    }
}
