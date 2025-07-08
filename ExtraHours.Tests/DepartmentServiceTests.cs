using ExtraHours.API.Models;
using ExtraHours.API.Repositories;
using ExtraHours.API.Services;
using NSubstitute;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ExtraHours.Test
{
    public class DepartmentServiceTests
    {
        private readonly IDepartmentRepository _repository;
        private readonly DepartmentService _service;

        public DepartmentServiceTests()
        {
            _repository = Substitute.For<IDepartmentRepository>();
            _service = new DepartmentService(_repository);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllDepartments()
        {
            // Arrange
            var departments = new List<Department>
            {
                new Department { Id = 1, Name = "IT", Status = "Activo" },
                new Department { Id = 2, Name = "HR", Status = "Inactivo" }
            };
            _repository.GetAllAsync().Returns(departments);

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Contains(result, d => d.Name == "IT");
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsDepartment()
        {
            // Arrange
            var department = new Department { Id = 1, Name = "IT", Status = "Activo" };
            _repository.GetByIdAsync(1).Returns(department);

            // Act
            var result = await _service.GetByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("IT", result?.Name);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Arrange
            _repository.GetByIdAsync(99).Returns((Department?)null);

            // Act
            var result = await _service.GetByIdAsync(99);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateAsync_ValidDepartment_ReturnsCreated()
        {
            // Arrange
            var department = new Department { Id = 3, Name = "Finance", Status = "Activo" };
            _repository.CreateAsync(department).Returns(department);

            // Act
            var result = await _service.CreateAsync(department);

            // Assert
            Assert.Equal("Finance", result.Name);
        }

        [Fact]
        public async Task UpdateAsync_ValidId_ReturnsUpdatedDepartment()
        {
            // Arrange
            var updated = new Department { Id = 1, Name = "Updated", Status = "Activo" };
            _repository.UpdateAsync(1, updated).Returns(updated);

            // Act
            var result = await _service.UpdateAsync(1, updated);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated", result?.Name);
        }

        [Fact]
        public async Task UpdateAsync_InvalidId_ReturnsNull()
        {
            // Arrange
            var updated = new Department { Id = 99, Name = "Ghost", Status = "Inactivo" };
            _repository.UpdateAsync(99, updated).Returns((Department?)null);

            // Act
            var result = await _service.UpdateAsync(99, updated);

            // Assert
            Assert.Null(result);
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
        public async Task DeleteAsync_InvalidId_ReturnsFalse()
        {
            // Arrange
            _repository.DeleteAsync(99).Returns(false);

            // Act
            var result = await _service.DeleteAsync(99);

            // Assert
            Assert.False(result);
        }
    }
}
