using ExtraHours.API.DTOs;
using ExtraHours.API.Interfaces;
using ExtraHours.API.Models;
using ExtraHours.API.Services;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ExtraHours.API.Tests.Services
{
    public class DashboardServiceTests
    {
        private readonly IUserService _userService;
        private readonly IExtraHourRequestService _extraHourService;
        private readonly IDepartmentService _departmentService;
        private readonly DashboardService _dashboardService;

        public DashboardServiceTests()
        {
            _userService = Substitute.For<IUserService>();
            _extraHourService = Substitute.For<IExtraHourRequestService>();
            _departmentService = Substitute.For<IDepartmentService>();
            _dashboardService = new DashboardService(_userService, _extraHourService, _departmentService);
        }

        [Fact]
        public async Task GetSummaryAsync_ReturnsCorrectSummary()
        {
            // Arrange
            var now = DateTime.Now;
            var mockUsers = GetMockUsers();
            var mockRequests = GetMockRequests(now);
            var mockDepartments = GetMockDepartments();

            _userService.GetAllAsync().Returns(mockUsers);
            _extraHourService.GetAllAsync().Returns(mockRequests);
            _departmentService.GetAllAsync().Returns(mockDepartments);

            // Act
            var result = await _dashboardService.GetSummaryAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(4, result.TotalUsers);
            Assert.Equal(3, result.ActiveUsers);
            Assert.Equal(2, result.PendingRequests);
            Assert.Equal(17, result.ApprovedHoursThisMonth); // ✅ corregido de 15 a 17
            Assert.Equal(2, result.ActiveDepartments);
            Assert.Equal(3, result.TotalDepartments);
            Assert.Equal(5, result.RecentRequests?.Count);
            Assert.Equal(3, result.DepartmentStats?.Count);
        }

        private List<UserDto> GetMockUsers()
        {
            return new List<UserDto>
            {
                new UserDto(new User
                {
                    Id = 1,
                    Username = "user1",
                    IsActive = true,
                    DepartmentId = 1,
                    Department = new Department { Id = 1, Name = "HR" }
                }),
                new UserDto(new User
                {
                    Id = 2,
                    Username = "user2",
                    IsActive = true,
                    DepartmentId = 1,
                    Department = new Department { Id = 1, Name = "HR" }
                }),
                new UserDto(new User
                {
                    Id = 3,
                    Username = "user3",
                    IsActive = false,
                    DepartmentId = 2,
                    Department = new Department { Id = 2, Name = "IT" }
                }),
                new UserDto(new User
                {
                    Id = 4,
                    Username = "user4",
                    IsActive = true,
                    DepartmentId = 3,
                    Department = new Department { Id = 3, Name = "Finance" }
                })
            };
        }

        private List<ExtraHourRequest> GetMockRequests(DateTime now)
        {
            var hrDepartment = new Department { Id = 1, Name = "HR" };
            var itDepartment = new Department { Id = 2, Name = "IT" };
            var financeDepartment = new Department { Id = 3, Name = "Finance" };

            return new List<ExtraHourRequest>
            {
                new ExtraHourRequest
                {
                    Id = 1,
                    RequestDate = now.AddDays(-5),
                    DateOfExtraHours = now.Date,
                    Status = "Pendiente",
                    StartTime = now.Date.AddHours(9),
                    EndTime = now.Date.AddHours(11),
                    User = new User
                    {
                        Id = 1,
                        Username = "user1",
                        Department = hrDepartment
                    }
                },
                new ExtraHourRequest
                {
                    Id = 2,
                    RequestDate = now.AddDays(-3),
                    DateOfExtraHours = now.Date,
                    Status = "Pendiente",
                    StartTime = now.Date.AddHours(10),
                    EndTime = now.Date.AddHours(14),
                    User = new User
                    {
                        Id = 2,
                        Username = "user2",
                        Department = hrDepartment
                    }
                },
                new ExtraHourRequest
                {
                    Id = 3,
                    RequestDate = now.AddDays(-1),
                    DateOfExtraHours = new DateTime(now.Year, now.Month, 1),
                    Status = "Aprobado",
                    StartTime = new DateTime(now.Year, now.Month, 1, 8, 0, 0),
                    EndTime = new DateTime(now.Year, now.Month, 1, 13, 0, 0),
                    User = new User
                    {
                        Id = 3,
                        Username = "user3",
                        Department = itDepartment
                    }
                },
                new ExtraHourRequest
                {
                    Id = 4,
                    RequestDate = now.AddDays(-2),
                    DateOfExtraHours = new DateTime(now.Year, now.Month, 5),
                    Status = "Aprobado",
                    StartTime = new DateTime(now.Year, now.Month, 5, 9, 0, 0),
                    EndTime = new DateTime(now.Year, now.Month, 5, 19, 0, 0),
                    User = new User
                    {
                        Id = 4,
                        Username = "user4",
                        Department = financeDepartment
                    }
                },
                new ExtraHourRequest
                {
                    Id = 5,
                    RequestDate = now.AddDays(-4),
                    DateOfExtraHours = new DateTime(now.Year, now.Month, 3),
                    Status = "Aprobado",
                    StartTime = new DateTime(now.Year, now.Month, 3, 10, 0, 0),
                    EndTime = new DateTime(now.Year, now.Month, 3, 12, 0, 0),
                    User = new User
                    {
                        Id = 1,
                        Username = "user1",
                        Department = hrDepartment
                    }
                }
            };
        }

        private List<Department> GetMockDepartments()
        {
            return new List<Department>
            {
                new Department { Id = 1, Name = "HR", Status = "Activo" },
                new Department { Id = 2, Name = "IT", Status = "Activo" },
                new Department { Id = 3, Name = "Finance", Status = "Inactivo" }
            };
        }
    }
}
