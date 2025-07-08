using ExtraHours.API.Models;
using ExtraHours.API.Services;
using Microsoft.AspNetCore.Http;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace ExtraHours.Test
{
    public class ExtraHourServiceTests
    {
        private readonly IExtraHourRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ExtraHourService _service;

        public ExtraHourServiceTests()
        {
            _repository = Substitute.For<IExtraHourRepository>();
            _httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            _service = new ExtraHourService(_repository, _httpContextAccessor);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllExtraHours()
        {
            // Arrange
            var extraHours = new List<ExtraHour>
            {
                new ExtraHour { Id = 1, Reason = "Worked late" },
                new ExtraHour { Id = 2, Reason = "Weekend support" }
            };
            _repository.GetAllAsync().Returns(extraHours);

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsExtraHour()
        {
            // Arrange
            var extraHour = new ExtraHour { Id = 1, Reason = "Support" };
            _repository.GetByIdAsync(1).Returns(extraHour);

            // Act
            var result = await _service.GetByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Support", result?.Reason);
        }

        [Fact]
        public async Task CreateAsync_WithAuthenticatedUser_SetsUserId()
        {
            // Arrange
            var userId = 42;
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = Substitute.For<HttpContext>();
            context.User.Returns(principal);
            _httpContextAccessor.HttpContext.Returns(context);

            var extraHour = new ExtraHour { Reason = "After hours fix" };
            _repository.CreateAsync(Arg.Any<ExtraHour>())
                       .Returns(call => call.Arg<ExtraHour>());

            // Act
            var result = await _service.CreateAsync(extraHour);

            // Assert
            Assert.Equal(userId, result.UserId);
            Assert.Equal("After hours fix", result.Reason);
        }

        [Fact]
        public async Task CreateAsync_WithoutAuthenticatedUser_DoesNotSetUserId()
        {
            // Arrange
            _httpContextAccessor.HttpContext.Returns((HttpContext?)null);

            var extraHour = new ExtraHour { Reason = "No user context" };
            _repository.CreateAsync(Arg.Any<ExtraHour>())
                       .Returns(call => call.Arg<ExtraHour>());

            // Act
            var result = await _service.CreateAsync(extraHour);

            // Assert
            Assert.Equal("No user context", result.Reason);
            Assert.Equal(0, result.UserId); // default int value
        }

        [Fact]
        public async Task UpdateAsync_ValidId_ReturnsUpdated()
        {
            // Arrange
            var updated = new ExtraHour { Id = 1, Reason = "Updated" };
            _repository.UpdateAsync(1, updated).Returns(updated);

            // Act
            var result = await _service.UpdateAsync(1, updated);

            // Assert
            Assert.Equal("Updated", result?.Reason);
        }

        [Fact]
        public async Task DeleteAsync_ValidId_ReturnsTrue()
        {
            // Arrange
            _repository.DeleteAsync(1).Returns(true);

            // Act
            var result = await _service.DeleteAsync(1);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task GetRecentAsync_ReturnsRecentEntries()
        {
            // Arrange
            var recent = new List<ExtraHour>
            {
                new ExtraHour { Id = 1 },
                new ExtraHour { Id = 2 }
            };
            _repository.GetRecentAsync(2).Returns(recent);

            // Act
            var result = await _service.GetRecentAsync(2);

            // Assert
            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetByUserIdAsync_ReturnsUserEntries()
        {
            // Arrange
            var userEntries = new List<ExtraHour>
            {
                new ExtraHour { Id = 1, UserId = 10 },
                new ExtraHour { Id = 2, UserId = 10 }
            };
            _repository.GetByUserIdAsync(10).Returns(userEntries);

            // Act
            var result = await _service.GetByUserIdAsync(10);

            // Assert
            Assert.All(result, r => Assert.Equal(10, r.UserId));
        }
    }
}
