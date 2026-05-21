using Microsoft.EntityFrameworkCore;
using LexiGo.Api.Data;

var builder = WebApplication.CreateBuilder(args);
var databasePath = Path.Combine(builder.Environment.ContentRootPath, "lexigo.db");

builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.SetIsOriginAllowed(origin =>
                  Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                  (uri.Host == "localhost" || uri.Host == "127.0.0.1"))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// app.UseHttpsRedirection(); // keep off for local HTTP dev

app.UseAuthorization();
app.MapControllers();

app.Run();
