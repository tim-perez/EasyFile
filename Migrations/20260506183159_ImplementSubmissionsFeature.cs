using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EasyFile.Migrations
{
    /// <inheritdoc />
    public partial class ImplementSubmissionsFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DocumentFee",
                table: "Documents",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SubmissionId",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuggestedDocumentTypes",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Submissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubmissionNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Recycled = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    County = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CaseNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CaseTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FilingType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CaseCategory = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CaseType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PlaintiffsOrPetitioners = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefendantsOrRespondents = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Attorneys = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalCourtFees = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UploaderId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Submissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Submissions_Users_UploaderId",
                        column: x => x.UploaderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Documents_SubmissionId",
                table: "Documents",
                column: "SubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_SubmissionNumber",
                table: "Submissions",
                column: "SubmissionNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_UploaderId",
                table: "Submissions",
                column: "UploaderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Submissions_SubmissionId",
                table: "Documents",
                column: "SubmissionId",
                principalTable: "Submissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Submissions_SubmissionId",
                table: "Documents");

            migrationBuilder.DropTable(
                name: "Submissions");

            migrationBuilder.DropIndex(
                name: "IX_Documents_SubmissionId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "DocumentFee",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "SubmissionId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "SuggestedDocumentTypes",
                table: "Documents");
        }
    }
}
