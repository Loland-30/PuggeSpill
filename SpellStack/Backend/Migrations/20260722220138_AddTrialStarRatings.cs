using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTrialStarRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PassedTrialRevision",
                table: "Decks",
                newName: "TrialResultRevision");

            migrationBuilder.AddColumn<int>(
                name: "BestTrialStars",
                table: "Decks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE "Decks"
                SET "BestTrialStars" = 1
                WHERE "TrialResultRevision" IS NOT NULL;
                """);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Decks_BestTrialStars",
                table: "Decks",
                sql: "\"BestTrialStars\" >= 0 AND \"BestTrialStars\" <= 3");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Decks_BestTrialStars",
                table: "Decks");

            migrationBuilder.Sql("""
                UPDATE "Decks"
                SET "TrialResultRevision" = NULL
                WHERE "BestTrialStars" < 1;
                """);

            migrationBuilder.DropColumn(
                name: "BestTrialStars",
                table: "Decks");

            migrationBuilder.RenameColumn(
                name: "TrialResultRevision",
                table: "Decks",
                newName: "PassedTrialRevision");
        }
    }
}
