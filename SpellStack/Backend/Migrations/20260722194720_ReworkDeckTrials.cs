using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReworkDeckTrials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ContentRevision",
                table: "Decks",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "PassedTrialRevision",
                table: "Decks",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentRevision",
                table: "Decks");

            migrationBuilder.DropColumn(
                name: "PassedTrialRevision",
                table: "Decks");
        }
    }
}
