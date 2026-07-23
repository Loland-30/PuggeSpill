using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTranslationCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TranslationCacheEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SourceLanguage = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    TargetLanguage = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    NormalizedSourceText = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    TranslationText = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    DetectedSourceLanguage = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TranslationCacheEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TranslationCacheEntries_SourceLanguage_TargetLanguage_Norma~",
                table: "TranslationCacheEntries",
                columns: new[] { "SourceLanguage", "TargetLanguage", "NormalizedSourceText" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TranslationCacheEntries");
        }
    }
}
