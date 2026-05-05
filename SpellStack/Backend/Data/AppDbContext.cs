using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Models;

namespace LexiGo.Api.Data {
    public class AppDbContext : DbContext {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) {
        }

        public DbSet<Deck> Decks { get; set; }
        public DbSet<Word> Words { get; set; }
        public DbSet<GameSession> GameSessions { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
    }
}
