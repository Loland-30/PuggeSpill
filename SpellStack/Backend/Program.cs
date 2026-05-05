using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using LexiGo.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.ReferenceHandler = 
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=lexigo.db"));

builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS Users (
            Id INTEGER NOT NULL CONSTRAINT PK_Users PRIMARY KEY AUTOINCREMENT,
            Username TEXT NOT NULL,
            Email TEXT NOT NULL,
            PasswordHash TEXT NOT NULL,
            PasswordSalt TEXT NOT NULL,
            FavoriteLanguage TEXT NOT NULL,
            CreatedAt TEXT NOT NULL
        );
    """);
    db.Database.ExecuteSqlRaw("""
        CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Email ON Users (Email);
    """);
    db.Database.ExecuteSqlRaw("""
        CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Username ON Users (Username);
    """);
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS UserSessions (
            Id INTEGER NOT NULL CONSTRAINT PK_UserSessions PRIMARY KEY AUTOINCREMENT,
            UserId INTEGER NOT NULL,
            Token TEXT NOT NULL,
            CreatedAt TEXT NOT NULL,
            ExpiresAt TEXT NOT NULL,
            CONSTRAINT FK_UserSessions_Users_UserId FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE CASCADE
        );
    """);
    db.Database.ExecuteSqlRaw("""
        CREATE UNIQUE INDEX IF NOT EXISTS IX_UserSessions_Token ON UserSessions (Token);
    """);
    AddColumnIfMissing(db, "ALTER TABLE Decks ADD COLUMN LearningLanguage TEXT NOT NULL DEFAULT '';");
    AddColumnIfMissing(db, "ALTER TABLE Decks ADD COLUMN UserId INTEGER NOT NULL DEFAULT 0;");
    AddColumnIfMissing(db, "ALTER TABLE GameSessions ADD COLUMN UserId INTEGER NOT NULL DEFAULT 0;");
    AddColumnIfMissing(db, "ALTER TABLE Users ADD COLUMN ThemeJson TEXT NOT NULL DEFAULT '';");
    db.Database.ExecuteSqlRaw("""
        UPDATE Decks
        SET LearningLanguage = COALESCE(NULLIF(TranslationLanguage, ''), Language, '')
        WHERE LearningLanguage = '';
    """);
}

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

static void AddColumnIfMissing(AppDbContext db, string sql) {
    try {
        db.Database.ExecuteSqlRaw(sql);
    } catch (SqliteException exception) when (exception.SqliteErrorCode == 1) {
        // Column already exists in local dev databases.
    }
}
