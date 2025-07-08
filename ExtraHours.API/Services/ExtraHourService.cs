using ExtraHours.API.Models;
using ExtraHours.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

public class ExtraHourService : IExtraHourService
{
    private readonly IExtraHourRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ExtraHourService(IExtraHourRepository repository, IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public Task<IEnumerable<ExtraHour>> GetAllAsync()
        => _repository.GetAllAsync();

    public Task<ExtraHour?> GetByIdAsync(int id)
        => _repository.GetByIdAsync(id);

    public async Task<ExtraHour> CreateAsync(ExtraHour extraHour)
    {
        var userId = GetAuthenticatedUserId();
        if (userId != null)
        {
            extraHour.UserId = userId.Value;
        }

        return await _repository.CreateAsync(extraHour);
    }

    public Task<ExtraHour?> UpdateAsync(int id, ExtraHour extraHour)
        => _repository.UpdateAsync(id, extraHour);

    public Task<bool> DeleteAsync(int id)
        => _repository.DeleteAsync(id);

    public Task<IEnumerable<ExtraHour>> GetRecentAsync(int count)
        => _repository.GetRecentAsync(count);

    public Task<IEnumerable<ExtraHour>> GetByUserIdAsync(int userId)
        => _repository.GetByUserIdAsync(userId);

    // 🔐 Método auxiliar para obtener el ID del usuario autenticado desde el token JWT
    private int? GetAuthenticatedUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out var id) ? id : (int?)null;
    }
}
