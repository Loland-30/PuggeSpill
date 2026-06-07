using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexiGo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceRunTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "LongestRushHourDurationSeconds",
                table: "GameSessions",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RushHoursCompleted",
                table: "GameSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RushHoursTriggered",
                table: "GameSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "LongestRushHourDurationSeconds",
                table: "GameRunResults",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RushHoursCompleted",
                table: "GameRunResults",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RushHoursTriggered",
                table: "GameRunResults",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LongestRushHourDurationSeconds",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "RushHoursCompleted",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "RushHoursTriggered",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "LongestRushHourDurationSeconds",
                table: "GameRunResults");

            migrationBuilder.DropColumn(
                name: "RushHoursCompleted",
                table: "GameRunResults");

            migrationBuilder.DropColumn(
                name: "RushHoursTriggered",
                table: "GameRunResults");
        }
    }
}
