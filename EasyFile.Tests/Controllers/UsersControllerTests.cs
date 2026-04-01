using System;
using System.Collections.Generic;
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
using EasyFile.Models.Pagination;

namespace EasyFile.Tests.Controllers
{
    public class UsersControllerTests
    {
        private readonly DbContextOptions<AppDbContext> _dbContextOptions;
        private readonly Mock<IDocumentService> _mockDocumentService;
        private readonly Mock<ILogger<UsersController>> _mockLogger;
        private readonly Mock<IMapper> _mockMapper;

        public UsersControllerTests()
        {
            _dbContextOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockDocumentService = new Mock<IDocumentService>();
            _mockLogger = new Mock<ILogger<UsersController>>();
            _mockMapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task GetAllUsers_SuccessfullyPaginates_AndFiltersByRole()
        {
            // ARRANGE: Seed the database with 1 Customer and 2 Admins
            using var context = new AppDbContext(_dbContextOptions);
            context.Users.AddRange(
                new User { Id = 1, FirstName = "Bob", LastName = "Smith", Email = "bob@test.com", AccountType = "Customer", PasswordHash = "fake-hash-1" },
                new User { Id = 2, FirstName = "Admin", LastName = "One", Email = "admin1@test.com", AccountType = "Admin", PasswordHash = "fake-hash-2" },
                new User { Id = 3, FirstName = "Admin", LastName = "Two", Email = "admin2@test.com", AccountType = "Admin", PasswordHash = "fake-hash-3" }
            );
            await context.SaveChangesAsync();

            var controller = new UsersController(context, _mockDocumentService.Object, _mockLogger.Object, _mockMapper.Object);

            // Create our query parameters asking specifically for Admins
            var queryParams = new UserQueryParameters
            {
                PageNumber = 1,
                PageSize = 10,
                RoleFilter = "Admin"
            };

            // ACT: Execute the endpoint
            var result = await controller.GetAllUsers(queryParams);

            // ASSERT: Verify it returned a 200 OK
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Verify the object returned is our exact PagedResult wrapper
            var pagedResult = Assert.IsType<PagedResult<object>>(okResult.Value);

            // PROVE THE MATH: We asked for Admins. Out of 3 users, exactly 2 are admins.
            Assert.Equal(2, pagedResult.TotalCount); // The database correctly counted 2
            Assert.Equal(2, pagedResult.Items.Count); // The array actually contains 2 items
            Assert.Equal(1, pagedResult.TotalPages); // 2 items easily fit on 1 page of size 10
        }
    }
}