using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Auth;
using SpellStack.Api.Data;
using SpellStack.Api.Multiplayer;
using SpellStack.Api.Services;

LoadLocalEnvironmentFile();

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
var allowedOrigins = GetAllowedOrigins(builder.Configuration, builder.Environment);

builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(SessionTokenAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, SessionTokenAuthenticationHandler>(SessionTokenAuthenticationHandler.SchemeName, _ => { });
builder.Services.AddAuthorization();
builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<AchievementService>();
builder.Services.AddHttpClient<IDeepLTranslationService, DeepLTranslationService>(client => {
    client.Timeout = TimeSpan.FromSeconds(12);
});
builder.Services.AddSingleton<ILexiconEnrichmentService, LexiconEnrichmentService>();
builder.Services.AddScoped<TranslationSuggestionService>();
builder.Services.AddSingleton<TranslationRequestLimiter>();
builder.Services.AddSingleton<UploadStorageService>();
builder.Services.AddSingleton<MultiplayerRoomService>();
builder.Services.AddSingleton<MultiplayerDisconnectCleanupService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions {
    FileProvider = app.Services.GetRequiredService<UploadStorageService>().CreateFileProvider(),
    RequestPath = "/uploads"
});

// app.UseHttpsRedirection(); // keep off for local HTTP dev

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<MultiplayerHub>("/hubs/multiplayer");

app.Run();

static string[] GetAllowedOrigins(IConfiguration configuration, IWebHostEnvironment environment) {
    var configuredOrigins = configuration
        .GetSection("Frontend:AllowedOrigins")
        .Get<string[]>() ?? [];

    var origins = configuredOrigins
        .Select(NormalizeCorsOrigin)
        .ToList();

    if (environment.IsDevelopment()) {
        origins.AddRange([
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]);
    }

    var distinctOrigins = origins
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();

    if (!environment.IsDevelopment() && distinctOrigins.Length == 0) {
        throw new InvalidOperationException("Frontend:AllowedOrigins must be configured in production.");
    }

    return distinctOrigins;
}

static string NormalizeCorsOrigin(string origin) {
    if (string.IsNullOrWhiteSpace(origin)) {
        throw new InvalidOperationException("Frontend:AllowedOrigins contains an empty origin.");
    }

    var trimmed = origin.Trim().TrimEnd('/');
    if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) ||
        (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)) {
        throw new InvalidOperationException($"Frontend:AllowedOrigins contains an invalid origin: {origin}");
    }

    return uri.GetLeftPart(UriPartial.Authority);
}

static void LoadLocalEnvironmentFile() {
    var currentDirectory = Directory.GetCurrentDirectory();
    var candidates = new[] {
        Path.Combine(currentDirectory, ".env"),
        Path.Combine(currentDirectory, "Backend", ".env")
    };
    var envPath = candidates.FirstOrDefault(File.Exists);
    if (envPath == null) return;

    foreach (var rawLine in File.ReadLines(envPath)) {
        var line = rawLine.Trim();
        if (line.Length == 0 || line.StartsWith('#')) continue;

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0) continue;

        var key = line[..separatorIndex].Trim();
        if (string.IsNullOrWhiteSpace(key) || Environment.GetEnvironmentVariable(key) != null) continue;

        var value = line[(separatorIndex + 1)..].Trim();
        if (value.Length >= 2 &&
            ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\''))) {
            value = value[1..^1];
        }
        Environment.SetEnvironmentVariable(key, value);
    }
}
