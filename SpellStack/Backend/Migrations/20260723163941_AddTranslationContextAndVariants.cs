using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTranslationContextAndVariants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cache rows are disposable and do not contain enough information
            // to infer resolved target variants, context, or request variants.
            migrationBuilder.Sql("DELETE FROM \"TranslationCacheEntries\";");

            migrationBuilder.DropIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_TargetLanguage_Norma~",
                table: "TranslationCacheEntries");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedContext",
                table: "TranslationCacheEntries",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RequestVariant",
                table: "TranslationCacheEntries",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ResolvedTargetLanguage",
                table: "TranslationCacheEntries",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_ResolvedTargetLangua~",
                table: "TranslationCacheEntries",
                columns: new[] { "SourceLanguage", "ResolvedTargetLanguage", "NormalizedSourceText", "NormalizedContext", "RequestVariant" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_ResolvedTargetLangua~",
                table: "TranslationCacheEntries");

            migrationBuilder.DropColumn(
                name: "NormalizedContext",
                table: "TranslationCacheEntries");

            migrationBuilder.DropColumn(
                name: "RequestVariant",
                table: "TranslationCacheEntries");

            migrationBuilder.DropColumn(
                name: "ResolvedTargetLanguage",
                table: "TranslationCacheEntries");

            migrationBuilder.CreateIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_TargetLanguage_Norma~",
                table: "TranslationCacheEntries",
                columns: new[] { "SourceLanguage", "TargetLanguage", "NormalizedSourceText" },
                unique: true);
        }
    }
}
