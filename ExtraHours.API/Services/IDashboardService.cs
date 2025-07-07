using ExtraHours.API.DTOs;

namespace ExtraHours.API.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetSummaryAsync();
    }
}