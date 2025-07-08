using ExtraHours.API.Data;
using ExtraHours.API.DTOs;
using ExtraHours.API.Models;
using ExtraHours.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ExtraHours.Test
{
    public class UserServiceTests
    {
        private readonly AppDbContext _context;
        private readonly UserService _service;

        public UserServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _service = new UserService(_context);
        }

        [Fact]
        public async Task CreateAsync_ValidUser_ReturnsUserDto()
        {
            // Arrange
            var department = new Department { Id = 1, Name = "IT", Employees = 0 };
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            var userDto = new UserCreationDto
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "securepass",
                FirstName = "Test",
                LastName = "User",
                Role = UserRole.Employee,
                DepartmentId = department.Id,
                Position = "Developer",
                IsActive = true
            };

            // Act
            var result = await _service.CreateAsync(userDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("testuser", result.Username);
            Assert.Equal("IT", result.DepartmentName);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllUsers()
        {
            // Arrange
            var department = new Department { Id = 2, Name = "HR", Employees = 1 };
            var user = new User
            {
                Username = "hruser",
                Email = "hr@example.com",
                PasswordHash = "hashed",
                FirstName = "HR",
                LastName = "User",
                Role = UserRole.Employee,
                Department = department,
                Position = "HR Rep",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Departments.Add(department);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            Assert.Single(result);
            Assert.Equal("hruser", result.First().Username);
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsUserDto()
        {
            // Arrange
            var department = new Department { Id = 3, Name = "Finance", Employees = 1 };
            var user = new User
            {
                Username = "finuser",
                Email = "fin@example.com",
                PasswordHash = "hashed",
                FirstName = "Fin",
                LastName = "User",
                Role = UserRole.Employee,
                Department = department,
                Position = "Analyst",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Departments.Add(department);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetByIdAsync(user.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("finuser", result?.Username);
        }

        [Fact]
        public async Task UpdateAsync_ValidId_UpdatesUser()
        {
            // Arrange
            var department = new Department { Id = 4, Name = "Legal", Employees = 1 };
            var user = new User
            {
                Username = "legaluser",
                Email = "legal@example.com",
                PasswordHash = "hashed",
                FirstName = "Legal",
                LastName = "User",
                Role = UserRole.Employee,
                Department = department,
                Position = "Lawyer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Departments.Add(department);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var updateDto = new UserUpdateDto
            {
                FirstName = "Updated",
                LastName = "Name"
            };

            // Act
            var result = await _service.UpdateAsync(user.Id, updateDto);

            // Assert
            Assert.True(result);
            var updatedUser = await _context.Users.FindAsync(user.Id);
            Assert.Equal("Updated", updatedUser?.FirstName);
        }

        [Fact]
        public async Task DeleteAsync_ExistingUser_RemovesUser()
        {
            // Arrange
            var department = new Department { Id = 5, Name = "Ops", Employees = 1 };
            var user = new User
            {
                Username = "opsuser",
                Email = "ops@example.com",
                PasswordHash = "hashed",
                FirstName = "Ops",
                LastName = "User",
                Role = UserRole.Employee,
                Department = department,
                Position = "Operator",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Departments.Add(department);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.DeleteAsync(user.Id);

            // Assert
            Assert.True(result);
            Assert.Null(await _context.Users.FindAsync(user.Id));
        }
    }
}
