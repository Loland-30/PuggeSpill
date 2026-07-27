using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using SpellStack.Api.Auth;
using SpellStack.Api.Data;
using SpellStack.Api.Multiplayer;
using SpellStack.Api.Services;

LoadLocalEnvironmentFile();

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
var allowedOrigins = GetAllowedOrigins(builder.Configuration, builder.Environment);
ValidatePasswordResetConfiguration(builder.Configuration, builder.Environment);

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
            .AllowAnyMethod()
            .SetPreflightMaxAge(TimeSpan.FromHours(1));
    });
});

builder.Services.AddAuthentication(SessionTokenAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, SessionTokenAuthenticationHandler>(SessionTokenAuthenticationHandler.SchemeName, _ => { });
builder.Services.AddAuthorization();
builder.Services.AddSignalR();
builder.Services.AddRateLimiter(options => {
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) => {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many attempts. Please try again later." },
            cancellationToken);
    };
    AddPasswordResetRateLimit(options, "password-reset-request", 5);
    AddPasswordResetRateLimit(options, "password-reset-verify", 20);
    AddPasswordResetRateLimit(options, "password-reset-complete", 10);
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<AchievementService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.Configure<MailtrapOptions>(
    builder.Configuration.GetSection(MailtrapOptions.SectionName));
builder.Services.AddHttpClient(
    MailtrapPasswordResetEmailSender.HttpClientName,
    client => client.Timeout = TimeSpan.FromSeconds(12));
builder.Services.AddScoped<
    IPasswordResetEmailSender,
    MailtrapPasswordResetEmailSender>();
builder.Services.AddSingleton<
    IPasswordResetIdentifierRateLimiter,
    PasswordResetIdentifierRateLimiter>();
builder.Services.AddHttpClient<IDeepLTranslationService, DeepLTranslationService>(client => {
    client.Timeout = TimeSpan.FromSeconds(12);
});
builder.Services.AddSingleton<IKoreanRomanizer, KoreanRomanizer>();
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
app.UseRateLimiter();
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

static void AddPasswordResetRateLimit(
    RateLimiterOptions options,
    string policyName,
    int permitLimit) {
    options.AddPolicy(policyName, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
}

static void ValidatePasswordResetConfiguration(
    IConfiguration configuration,
    IWebHostEnvironment environment) {
    var mailtrapOptions = configuration
        .GetSection(MailtrapOptions.SectionName)
        .Get<MailtrapOptions>() ?? new MailtrapOptions();
    mailtrapOptions.Validate();

    if (!environment.IsProduction()) return;

    var hmacKey = configuration["PASSWORD_RESET_HMAC_KEY"]
        ?? configuration["PasswordReset:HmacKey"];
    if (string.IsNullOrWhiteSpace(hmacKey) || hmacKey.Length < 32) {
        throw new InvalidOperationException(
            "PASSWORD_RESET_HMAC_KEY must contain at least 32 characters in production.");
    }
}

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
