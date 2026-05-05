using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexiGo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAlternativeTranslation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AlternativeTranslation",
                table: "Words",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlternativeTranslation",
                table: "Words");
        }
    }
}
