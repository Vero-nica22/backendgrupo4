using ExtraHours.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ExtraHours.API.Services;

public interface IExtraHourService
{
    Task<IEnumerable<ExtraHour>> GetAllAsync();
    Task<ExtraHour?> GetByIdAsync(int id);
    Task<IEnumerable<ExtraHour>> GetRecentAsync(int count);
    Task<ExtraHour> CreateAsync(ExtraHour extraHour);
    Task<ExtraHour?> UpdateAsync(int id, ExtraHour extraHour);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<ExtraHour>> GetByUserIdAsync(int userId);
}
