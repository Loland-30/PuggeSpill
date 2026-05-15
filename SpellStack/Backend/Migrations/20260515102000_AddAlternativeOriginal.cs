using LexiGo.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexiGo.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260515102000_AddAlternativeOriginal")]
    public partial class AddAlternativeOriginal : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AlternativeOriginal",
                table: "Words",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlternativeOriginal",
                table: "Words");
        }
    }
}
