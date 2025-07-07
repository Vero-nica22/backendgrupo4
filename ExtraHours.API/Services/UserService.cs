using ExtraHours.API.Data;
using ExtraHours.API.Models;
using ExtraHours.API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        return await _context.Users
            .Include(u => u.Department)
            .Select(u => new UserDto(u))
            .ToListAsync();
    }

  public async Task<UserDto?> GetByIdAsync(int id)
{
    var user = await _context.Users
        .Include(u => u.Department) 
        .FirstOrDefaultAsync(u => u.Id == id);

    return user != null ? new UserDto(user) : null;
}



    public async Task<UserDto?> CreateAsync(UserCreationDto userDto)
    {
        if (await _context.Users.AnyAsync(u => u.Username == userDto.Username || u.Email == userDto.Email))
            return null;

        string passwordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password);

        // Buscar el departamento real por ID
        var department = await _context.Departments.FindAsync(userDto.DepartmentId);
        if (department == null)
            throw new Exception($"No se encontró el departamento con ID {userDto.DepartmentId}");

        var user = new User
        {
            Username = userDto.Username,
            Email = userDto.Email,
            PasswordHash = passwordHash,
            FirstName = userDto.FirstName,
            LastName = userDto.LastName,
            Role = userDto.Role,
            Department = department,
            Position = userDto.Position,
            IsActive = userDto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        department.Employees++;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new UserDto(user);
    }


    public async Task<bool> UpdateAsync(int id, UserUpdateDto userDto)
    {
        var existingUser = await _context.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (existingUser == null)
            return false;

        if (userDto.Email != null && await _context.Users.AnyAsync(u => u.Email == userDto.Email && u.Id != id))
            return false;
        if (userDto.Username != null && await _context.Users.AnyAsync(u => u.Username == userDto.Username && u.Id != id))
            return false;

        existingUser.Username = userDto.Username ?? existingUser.Username;
        existingUser.Email = userDto.Email ?? existingUser.Email;
        existingUser.FirstName = userDto.FirstName ?? existingUser.FirstName;
        existingUser.LastName = userDto.LastName ?? existingUser.LastName;
        existingUser.Role = userDto.Role ?? existingUser.Role;
        existingUser.Position = userDto.Position ?? existingUser.Position;
        existingUser.IsActive = userDto.IsActive ?? existingUser.IsActive;
        existingUser.ProfilePictureUrl = userDto.ProfilePictureUrl ?? existingUser.ProfilePictureUrl;
        existingUser.UpdatedAt = DateTime.UtcNow;

        if (userDto.DepartmentId.HasValue && userDto.DepartmentId.Value != existingUser.Department?.Id)
        {

            var oldDepartment = await _context.Departments.FindAsync(existingUser.DepartmentId);
            if (oldDepartment != null) oldDepartment.Employees--;


            var newDepartment = await _context.Departments.FindAsync(userDto.DepartmentId.Value);
            if (newDepartment == null)
                throw new Exception($"No se encontró el departamento con ID {userDto.DepartmentId}");

            newDepartment.Employees++;
            existingUser.Department = newDepartment;
        }

        if (userDto.DepartmentId.HasValue && userDto.DepartmentId.Value != existingUser.Department?.Id)
        {
            var department = await _context.Departments.FindAsync(userDto.DepartmentId.Value);
            if (department == null)
                throw new Exception($"No se encontró el departamento con ID {userDto.DepartmentId}");

            existingUser.Department = department;
        }

        _context.Entry(existingUser).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return true;
    }


    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return false;


        if (user.Department != null)
        {
            user.Department.Employees--;
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

}