using ExtraHours.API.Data;
using ExtraHours.API.DTOs;
using ExtraHours.API.Models;
using ExtraHours.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using NSubstitute;

namespace ExtraHours.Test
{
    public class AuthServiceTests
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _configuration = Substitute.For<IConfiguration>();

            // ✅ Clave JWT corregida (mínimo 32 caracteres)
            _configuration["Jwt:Key"].Returns("supersecretkey1234567890EXTRASEGURA!");
            _configuration["Jwt:Issuer"].Returns("testissuer");
            _configuration["Jwt:Audience"].Returns("testaudience");

            _authService = new AuthService(_context, _configuration);
        }

        [Fact]
        public async Task RegisterAsync_NewUser_ReturnsUser()
        {
            var department = new Department { Id = 1, Name = "Gerencia" };
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            var request = new RegisterRequest
            {
                Username = "newuser",
                Email = "newuser@example.com",
                Password = "password123",
                FirstName = "New",
                LastName = "User"
            };

            var result = await _authService.RegisterAsync(request);

            Assert.NotNull(result);
            Assert.Equal("newuser", result.Username);
            Assert.Equal("Gerencia", result.Department.Name);
        }

        [Fact]
        public async Task RegisterAsync_ExistingUsernameOrEmail_ReturnsNull()
        {
            var existing = new User
            {
                Username = "existing",
                Email = "existing@example.com",
                PasswordHash = "hashed",
                Department = new Department { Name = "Gerencia" }
            };
            _context.Users.Add(existing);
            _context.Departments.Add(existing.Department);
            await _context.SaveChangesAsync();

            var request = new RegisterRequest
            {
                Username = "existing",
                Email = "existing@example.com",
                Password = "password123",
                FirstName = "Test",
                LastName = "User"
            };

            var result = await _authService.RegisterAsync(request);

            Assert.Null(result);
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsTokenAndUser()
        {
            var password = "password123";
            var hashed = BCrypt.Net.BCrypt.HashPassword(password);
            var department = new Department { Name = "Gerencia" };
            var user = new User
            {
                Username = "loginuser",
                Email = "login@example.com",
                PasswordHash = hashed,
                IsActive = true,
                Department = department
            };
            _context.Users.Add(user);
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            var request = new LoginRequest
            {
                UsernameOrEmail = "loginuser",
                Password = password
            };

            var (token, resultUser) = await _authService.LoginAsync(request, rememberMe: false);

            Assert.NotNull(token);
            Assert.NotNull(resultUser);
            Assert.Equal("loginuser", resultUser.Username);
        }

        [Fact]
        public async Task LoginAsync_InvalidPassword_ReturnsNull()
        {
            var user = new User
            {
                Username = "wrongpass",
                Email = "wrong@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpass"),
                IsActive = true,
                Department = new Department { Name = "Gerencia" }
            };
            _context.Users.Add(user);
            _context.Departments.Add(user.Department);
            await _context.SaveChangesAsync();

            var request = new LoginRequest
            {
                UsernameOrEmail = "wrongpass",
                Password = "wrongpass"
            };

            var (token, resultUser) = await _authService.LoginAsync(request, rememberMe: false);

            Assert.Null(token);
            Assert.Null(resultUser);
        }

        [Fact]
        public async Task LoginAsync_InactiveUser_ReturnsNullToken()
        {
            var user = new User
            {
                Username = "inactive",
                Email = "inactive@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
                IsActive = false,
                Department = new Department { Name = "Gerencia" }
            };
            _context.Users.Add(user);
            _context.Departments.Add(user.Department);
            await _context.SaveChangesAsync();

            var request = new LoginRequest
            {
                UsernameOrEmail = "inactive",
                Password = "password"
            };

            var (token, resultUser) = await _authService.LoginAsync(request, rememberMe: false);

            Assert.Null(token);
            Assert.NotNull(resultUser);
            Assert.False(resultUser.IsActive);
        }
    }
}
