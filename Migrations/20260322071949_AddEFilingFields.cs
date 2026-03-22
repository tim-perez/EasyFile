using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EasyFile.Migrations
{
    /// <inheritdoc />
    public partial class AddEFilingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CaseCategory",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CaseType",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EFilingDocType",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EstimatedFee",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FiledBy",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FilingType",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RefersTo",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Representation",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Warnings",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CaseCategory",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CaseType",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "EFilingDocType",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "EstimatedFee",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "FiledBy",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "FilingType",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "RefersTo",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Representation",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Warnings",
                table: "Documents");
        }
    }
}
