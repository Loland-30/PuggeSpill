using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class HashSessionTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Token",
                table: "UserSessions",
                newName: "TokenHash");

            migrationBuilder.Sql("DELETE FROM \"UserSessions\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"UserSessions\";");

            migrationBuilder.RenameColumn(
                name: "TokenHash",
                table: "UserSessions",
                newName: "Token");
        }
    }
}
