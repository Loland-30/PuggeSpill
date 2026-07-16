using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUpdatePostsAndAdminRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "UpdatePosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UpdatePosts", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "UpdatePosts",
                columns: new[] { "Id", "Category", "Content", "CreatedAt", "IsPublished", "PublishedAt", "Slug", "Status", "Summary", "Title", "UpdatedAt", "Version" },
                values: new object[,]
                {
                    { 1, "Core", "SpellStack's first playable release established the core vocabulary-practice experience.\n\n- Account and profile flow\n- Custom vocabulary decks\n- Core quiz and battle gameplay loop\n- Themes and settings\n- Production deployment foundation", new DateTime(2026, 7, 1, 10, 0, 0, 0, DateTimeKind.Utc), true, new DateTime(2026, 7, 1, 10, 0, 0, 0, DateTimeKind.Utc), "v0-1-0-early-spellstack-build", "Live", "Initial playable SpellStack build with accounts, decks and gameplay.", "Early SpellStack Build", new DateTime(2026, 7, 1, 10, 0, 0, 0, DateTimeKind.Utc), "v0.1.0" },
                    { 2, "Polish", "This release made themes more dependable and the interface easier to read across different backgrounds.\n\n- Adjusted default theme behavior\n- Improved gradient and solid theme support\n- More reliable custom background loading\n- Continued UI readability polish", new DateTime(2026, 7, 9, 10, 0, 0, 0, DateTimeKind.Utc), true, new DateTime(2026, 7, 9, 10, 0, 0, 0, DateTimeKind.Utc), "v0-1-5-theme-ui-polish", "Live", "Improved visual polish and theme behavior across SpellStack.", "Theme & UI Polish", new DateTime(2026, 7, 9, 10, 0, 0, 0, DateTimeKind.Utc), "v0.1.5" },
                    { 3, "Responsive", "SpellStack now adapts more intentionally to the screen it is played on.\n\n- Responsive layouts for desktop, tablet and mobile\n- Improved navigation across screen sizes\n- Profile, deck and gameplay layout polish\n- Better mobile gameplay readability and usability", new DateTime(2026, 7, 14, 10, 0, 0, 0, DateTimeKind.Utc), true, new DateTime(2026, 7, 14, 10, 0, 0, 0, DateTimeKind.Utc), "v0-2-0-responsive-design", "Live", "Improved SpellStack across desktop, tablet and mobile layouts.", "Responsive Design", new DateTime(2026, 7, 14, 10, 0, 0, 0, DateTimeKind.Utc), "v0.2.0" },
                    { 4, "Multiplayer", "The multiplayer lobby now has a real realtime foundation while keeping gameplay setup familiar.\n\n- Private rooms with shareable room codes\n- Live player list and ready state\n- SignalR room communication\n- Leave and reconnect-aware room handling", new DateTime(2026, 7, 15, 10, 0, 0, 0, DateTimeKind.Utc), true, new DateTime(2026, 7, 15, 10, 0, 0, 0, DateTimeKind.Utc), "v0-3-0-realtime-multiplayer-lobby", "Live", "Added the first realtime multiplayer foundation to SpellStack.", "Realtime Multiplayer Lobby", new DateTime(2026, 7, 15, 10, 0, 0, 0, DateTimeKind.Utc), "v0.3.0" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_UpdatePosts_Slug",
                table: "UpdatePosts",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UpdatePosts");

            migrationBuilder.DropColumn(
                name: "IsAdmin",
                table: "Users");
        }
    }
}
