using ExtraHours.API.DTOs;
using ExtraHours.API.Models;
using ExtraHours.API.Repositories;
using ExtraHours.API.Services;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ExtraHours.Test
{
    public class ExtraHourRequestServiceTests
    {
        private readonly IExtraHourRequestRepository _repository;
        private readonly ExtraHourRequestService _service;

        public ExtraHourRequestServiceTests()
        {
            _repository = Substitute.For<IExtraHourRequestRepository>();
            _service = new ExtraHourRequestService(_repository);
        }

        [Fact]
        public async Task CreateAsync_ValidRequest_ReturnsCreatedRequest()
        {
            // Arrange
            var userId = 1;
            var now = DateTime.UtcNow;

            var requestDto = new ExtraHourRequestCreateDto
            {
                DateOfExtraHours = now.Date,
                StartTime = now.AddHours(-2),
                EndTime = now,
                Reason = "Worked on urgent bug fix",
                ExtraHourTypeId = 1
            };

            var expectedRequest = new ExtraHourRequest
            {
                UserId = userId,
                DateOfExtraHours = requestDto.DateOfExtraHours,
                StartTime = requestDto.StartTime,
                EndTime = requestDto.EndTime,
                Reason = requestDto.Reason,
                Status = "Pendiente",
                RequestDate = now,
                AdminComments = string.Empty
            };

            _repository.CreateAsync(Arg.Any<ExtraHourRequest>())
                       .Returns(call => call.Arg<ExtraHourRequest>());

            // Act
            var result = await _service.CreateAsync(userId, requestDto);

            // Assert
            Assert.Equal(userId, result.UserId);
            Assert.Equal("Pendiente", result.Status);
            Assert.Equal(requestDto.Reason, result.Reason);
            Assert.Equal(requestDto.StartTime, result.StartTime);
            Assert.Equal(requestDto.EndTime, result.EndTime);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsRequest()
        {
            // Arrange
            var request = new ExtraHourRequest { Id = 1, Reason = "Support" };
            _repository.GetByIdAsync(1).Returns(request);

            // Act
            var result = await _service.GetByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Support", result?.Reason);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            _repository.GetByIdAsync(99).Returns((ExtraHourRequest?)null);

            // Act
            var result = await _service.GetByIdAsync(99);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllRequests()
        {
            // Arrange
            var requests = new List<ExtraHourRequest>
            {
                new ExtraHourRequest { Id = 1, Reason = "Late deployment" },
                new ExtraHourRequest { Id = 2, Reason = "System maintenance" }
            };

            _repository.GetAllAsync().Returns(requests);

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Contains(result, r => r.Reason == "Late deployment");
        }
    }
}
