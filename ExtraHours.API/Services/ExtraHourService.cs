using ExtraHours.API.Models;
using ExtraHours.API.Services;

public class ExtraHourService : IExtraHourService
{
    private readonly IExtraHourRepository _repository;

    public ExtraHourService(IExtraHourRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<ExtraHour>> GetAllAsync()
        => _repository.GetAllAsync();

    public Task<ExtraHour?> GetByIdAsync(int id)
        => _repository.GetByIdAsync(id);

    public Task<ExtraHour> CreateAsync(ExtraHour extraHour)
        => _repository.CreateAsync(extraHour);

    public Task<ExtraHour?> UpdateAsync(int id, ExtraHour extraHour)
        => _repository.UpdateAsync(id, extraHour);

    public Task<bool> DeleteAsync(int id)
        => _repository.DeleteAsync(id);

    public Task<IEnumerable<ExtraHour>> GetRecentAsync(int count)
        => _repository.GetRecentAsync(count);

    // ✅ Nuevo método para filtrar por usuario
    public Task<IEnumerable<ExtraHour>> GetByUserIdAsync(int userId)
        => _repository.GetByUserIdAsync(userId);
}
