using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EasyFile.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseTitleColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CaseTitle",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CaseTitle",
                table: "Documents");
        }
    }
}
