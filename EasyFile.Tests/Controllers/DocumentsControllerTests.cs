using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using AutoMapper;
using Microsoft.Extensions.Logging;
using EasyFile.Controllers;
using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Models;

namespace EasyFile.Tests.Controllers
{
    public class DocumentsControllerTests
    {
        private readonly DbContextOptions<AppDbContext> _dbContextOptions;
        private readonly Mock<IDocumentService> _mockDocumentService;
        private readonly Mock<ITextractService> _mockTextractService;
        private readonly Mock<IAiReviewService> _mockAiReviewService;
        private readonly Mock<IPdfReportService> _mockPdfReportService;
        private readonly Mock<ILogger<DocumentsController>> _mockLogger;
        private readonly Mock<IMapper> _mockMapper;

        public DocumentsControllerTests()
        {
            // 1. IN-MEMORY DB: A fake SQL database that lives in RAM and resets every test
            _dbContextOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            // 2. MOQ: Create "Stunt Doubles" for your AWS and External Services
            _mockDocumentService = new Mock<IDocumentService>();
            _mockTextractService = new Mock<ITextractService>();
            _mockAiReviewService = new Mock<IAiReviewService>();
            _mockPdfReportService = new Mock<IPdfReportService>();
            _mockLogger = new Mock<ILogger<DocumentsController>>();
            _mockMapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task DeleteDocument_ReturnsNotFound_WhenDocumentDoesNotExist()
        {
            // ARRANGE: Build the controller with our fake empty database
            using var context = new AppDbContext(_dbContextOptions);
            var controller = new DocumentsController(
                context, _mockDocumentService.Object, _mockTextractService.Object,
                _mockAiReviewService.Object, _mockPdfReportService.Object, 
                _mockLogger.Object, _mockMapper.Object);

            // ACT: Try to delete a document ID that doesn't exist
            var result = await controller.DeleteDocument(999);

            // ASSERT: Prove that the controller intercepted the bad ID and returned a 404
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal(404, notFoundResult.StatusCode);
        }

        [Fact]
        public async Task DeleteDocument_SoftDeletesAndReturnsOk_WhenDocumentExists()
        {
            // ARRANGE: Seed the fake database with a single document
            using var context = new AppDbContext(_dbContextOptions);
            var testDocument = new Document { 
                Id = 1, UploaderId = 1, FileName = "test.pdf", 
                FileUrl = "aws-url", Status = "Processed", Recycled = false 
            };
            context.Documents.Add(testDocument);
            await context.SaveChangesAsync();

            var controller = new DocumentsController(
                context, _mockDocumentService.Object, _mockTextractService.Object,
                _mockAiReviewService.Object, _mockPdfReportService.Object, 
                _mockLogger.Object, _mockMapper.Object);

            // ACT: Tell the controller to delete Document #1
            var result = await controller.DeleteDocument(1);

            // ASSERT 1: Prove the API returned a 200 OK success message
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);

            // ASSERT 2: Look inside the database to prove the Recycled flag flipped to true!
            var deletedDoc = await context.Documents.FindAsync(1);
            Assert.True(deletedDoc.Recycled);
            Assert.NotNull(deletedDoc.DeletedAt);
        }

        [Fact]
        public async Task GetDocumentUrl_ReturnsPresignedUrl_UsingAwsMoq()
        {
            // ARRANGE: Seed the database
            using var context = new AppDbContext(_dbContextOptions);
            var testDoc = new Document { Id = 2, UploaderId = 1, FileName = "brief.pdf", FileUrl = "s3-key-123", Recycled = false };
            context.Documents.Add(testDoc);
            await context.SaveChangesAsync();

            // MAGIC: Tell our Moq Stunt Double exactly how to behave when the controller calls it!
            var fakeAwsLink = "https://fake-aws-s3-url.com/brief.pdf?token=abc";
            _mockDocumentService
                .Setup(s => s.GetDocumentPresignedUrlAsync("s3-key-123"))
                .ReturnsAsync(fakeAwsLink);

            var controller = new DocumentsController(
                context, _mockDocumentService.Object, _mockTextractService.Object,
                _mockAiReviewService.Object, _mockPdfReportService.Object, 
                _mockLogger.Object, _mockMapper.Object);

            // ACT: Request the URL
            var result = await controller.GetDocumentUrl(2);

            // ASSERT: Prove the controller successfully routed the fake AWS link to the user
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            
            // MAGIC: Serialize the object exactly like the real API does to safely bypass cross-project security!
            var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var returnedUrl = doc.RootElement.GetProperty("url").GetString();
            
            Assert.Equal(fakeAwsLink, returnedUrl);
        }
    }
}