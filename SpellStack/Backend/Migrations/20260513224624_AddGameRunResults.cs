using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexiGo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGameRunResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BestStreak",
                table: "GameSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CorrectAnswers",
                table: "GameSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ModifiersJson",
                table: "GameSessions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "ResultSaved",
                table: "GameSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "TotalResponseTimeSeconds",
                table: "GameSessions",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WrongAnswers",
                table: "GameSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "GameRunResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    DeckId = table.Column<int>(type: "INTEGER", nullable: false),
                    GameSessionId = table.Column<int>(type: "INTEGER", nullable: true),
                    LanguageCode = table.Column<string>(type: "TEXT", nullable: false),
                    FinalScore = table.Column<int>(type: "INTEGER", nullable: false),
                    CorrectAnswers = table.Column<int>(type: "INTEGER", nullable: false),
                    WrongAnswers = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalAnswers = table.Column<int>(type: "INTEGER", nullable: false),
                    AccuracyPercent = table.Column<double>(type: "REAL", nullable: false),
                    BestStreak = table.Column<int>(type: "INTEGER", nullable: false),
                    HighestCombo = table.Column<int>(type: "INTEGER", nullable: false),
                    AverageResponseTimeSeconds = table.Column<double>(type: "REAL", nullable: true),
                    RoundLimit = table.Column<int>(type: "INTEGER", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndReason = table.Column<string>(type: "TEXT", nullable: false),
                    ModifiersJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameRunResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GameRunResults_Decks_DeckId",
                        column: x => x.DeckId,
                        principalTable: "Decks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GameRunResults_GameSessions_GameSessionId",
                        column: x => x.GameSessionId,
                        principalTable: "GameSessions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GameRunResults_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GameRunResults_DeckId",
                table: "GameRunResults",
                column: "DeckId");

            migrationBuilder.CreateIndex(
                name: "IX_GameRunResults_GameSessionId",
                table: "GameRunResults",
                column: "GameSessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameRunResults_UserId",
                table: "GameRunResults",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameRunResults");

            migrationBuilder.DropColumn(
                name: "BestStreak",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "CorrectAnswers",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "ModifiersJson",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "ResultSaved",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "TotalResponseTimeSeconds",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "WrongAnswers",
                table: "GameSessions");
        }
    }
}
