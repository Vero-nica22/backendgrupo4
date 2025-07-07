using ExtraHours.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExtraHourRepository
{
    Task<IEnumerable<ExtraHour>> GetAllAsync();
    Task<ExtraHour?> GetByIdAsync(int id);
    Task<IEnumerable<ExtraHour>> GetRecentAsync(int count);
    Task<ExtraHour> CreateAsync(ExtraHour extraHour);
    Task<ExtraHour?> UpdateAsync(int id, ExtraHour extraHour);
    Task<bool> DeleteAsync(int id);

    // ✅ Nuevo método
    Task<IEnumerable<ExtraHour>> GetByUserIdAsync(int userId);
}
