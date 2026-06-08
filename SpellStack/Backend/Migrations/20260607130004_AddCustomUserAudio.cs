using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexiGo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomUserAudio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomLoginSplashSoundUrl",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomMainMenuMusicUrl",
                table: "Users",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomLoginSplashSoundUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CustomMainMenuMusicUrl",
                table: "Users");
        }
    }
}
