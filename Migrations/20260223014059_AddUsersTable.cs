using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EasyFile.Migrations
{
    /// <inheritdoc />
    public partial class AddUsersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Users",
                newName: "Id");

            // Comment out or delete these two blocks since the columns are already named correctly:
            /*
            migrationBuilder.RenameColumn(
                name: "UploadDate",
                table: "Documents",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "DocumentId",
                table: "Documents",
                newName: "Id");
            */

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Users",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Documents",
                newName: "UploadDate");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Documents",
                newName: "DocumentId");
        }
    }
}