using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpellStack.Api.Migrations
{
    /// <inheritdoc />
    public partial class HardenPasswordResetFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Legacy reset links are intentionally invalidated. Their token hashes
            // cannot be converted into the new one-time verification-code format.
            migrationBuilder.Sql("DELETE FROM \"PasswordResetTokens\";");

            migrationBuilder.DropIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "TokenHash",
                table: "PasswordResetTokens");

            migrationBuilder.RenameColumn(
                name: "UsedAt",
                table: "PasswordResetTokens",
                newName: "VerifiedAt");

            migrationBuilder.AddColumn<int>(
                name: "AttemptCount",
                table: "PasswordResetTokens",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CodeHash",
                table: "PasswordResetTokens",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CodeSalt",
                table: "PasswordResetTokens",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ConcurrencyStamp",
                table: "PasswordResetTokens",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RequestIpHash",
                table: "PasswordResetTokens",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResetTokenExpiresAt",
                table: "PasswordResetTokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResetTokenHash",
                table: "PasswordResetTokens",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResetTokenUsedAt",
                table: "PasswordResetTokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupersededAt",
                table: "PasswordResetTokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_ResetTokenHash",
                table: "PasswordResetTokens",
                column: "ResetTokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId_CreatedAt",
                table: "PasswordResetTokens",
                columns: new[] { "UserId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PasswordResetTokens_ResetTokenHash",
                table: "PasswordResetTokens");

            migrationBuilder.DropIndex(
                name: "IX_PasswordResetTokens_UserId_CreatedAt",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "AttemptCount",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "CodeHash",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "CodeSalt",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "ConcurrencyStamp",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "RequestIpHash",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "ResetTokenExpiresAt",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "ResetTokenHash",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "ResetTokenUsedAt",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "SupersededAt",
                table: "PasswordResetTokens");

            migrationBuilder.RenameColumn(
                name: "VerifiedAt",
                table: "PasswordResetTokens",
                newName: "UsedAt");

            migrationBuilder.AddColumn<string>(
                name: "TokenHash",
                table: "PasswordResetTokens",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens",
                column: "UserId");
        }
    }
}
