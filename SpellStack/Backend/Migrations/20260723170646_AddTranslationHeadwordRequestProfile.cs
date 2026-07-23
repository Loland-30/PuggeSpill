using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTranslationHeadwordRequestProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Translation cache rows are disposable and belong to the previous request profile.
            migrationBuilder.Sql("DELETE FROM \"TranslationCacheEntries\";");

            migrationBuilder.DropIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_ResolvedTargetLangua~",
                table: "TranslationCacheEntries");

            migrationBuilder.AddColumn<bool>(
                name: "HeadwordInstructionsApplied",
                table: "TranslationCacheEntries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RequestProfile",
                table: "TranslationCacheEntries",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_ResolvedTargetLangua~",
                table: "TranslationCacheEntries",
                columns: new[] { "SourceLanguage", "ResolvedTargetLanguage", "NormalizedSourceText", "NormalizedContext", "RequestProfile", "HeadwordInstructionsApplied", "RequestVariant" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_ResolvedTargetLangua~",
                table: "TranslationCacheEntries");

            migrationBuilder.DropColumn(
                name: "HeadwordInstructionsApplied",
                table: "TranslationCacheEntries");

            migrationBuilder.DropColumn(
                name: "RequestProfile",
                table: "TranslationCacheEntries");

            migrationBuilder.CreateIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_ResolvedTargetLangua~",
                table: "TranslationCacheEntries",
                columns: new[] { "SourceLanguage", "ResolvedTargetLanguage", "NormalizedSourceText", "NormalizedContext", "RequestVariant" },
                unique: true);
        }
    }
}
