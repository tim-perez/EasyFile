using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EasyFile.Migrations
{
    /// <inheritdoc />
    public partial class DeletedAtIntoDocumentsModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsTrashed",
                table: "Documents");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Documents",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Documents");

            migrationBuilder.AddColumn<bool>(
                name: "IsTrashed",
                table: "Documents",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
