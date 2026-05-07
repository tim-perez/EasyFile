using AutoMapper;
using EasyFile.Mappings;
using EasyFile.Models;
using EasyFile.Models.DTOs;
using Microsoft.Extensions.Logging.Abstractions;

namespace EasyFile.Tests.Mappings
{
    public class DocumentProfileTests
    {
        private readonly IMapper _mapper;

        public DocumentProfileTests()
        {
            var expression = new MapperConfigurationExpression();
            expression.AddProfile<DocumentProfile>();
            var config = new MapperConfiguration(expression, NullLoggerFactory.Instance);
            _mapper = config.CreateMapper();
        }

        [Theory]
        [InlineData("None")]
        [InlineData("None.")]
        [InlineData("(none)")]
        [InlineData("")]
        [InlineData("   ")]
        public void Map_AcceptsDocument_WhenOnlyWarningIsNoneSentinel(string warning)
        {
            var report = new AiDocumentReportDto
            {
                Prediction = "Accepted",
                Warnings = new List<string> { warning }
            };

            var document = _mapper.Map<Document>(report);

            Assert.Equal("Accepted", document.Prediction);
        }

        [Fact]
        public void Map_RejectsDocument_WhenWarningIsSubstantive()
        {
            var report = new AiDocumentReportDto
            {
                Prediction = "Accepted",
                Warnings = new List<string> { "Missing signature" }
            };

            var document = _mapper.Map<Document>(report);

            Assert.Equal("Rejected", document.Prediction);
        }
    }
}
