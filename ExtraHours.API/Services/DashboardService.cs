using ExtraHours.API.DTOs;
using ExtraHours.API.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ExtraHours.API.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUserService _userService;
        private readonly IExtraHourRequestService _extraHourService;
        private readonly IDepartmentService _departmentService;

        public DashboardService(
            IUserService userService,
            IExtraHourRequestService extraHourService,
            IDepartmentService departmentService)
        {
            _userService = userService;
            _extraHourService = extraHourService;
            _departmentService = departmentService;
        }

        public async Task<DashboardSummaryDto> GetSummaryAsync()
        {
            var now = DateTime.Now;

            var users = await _userService.GetAllAsync();
            var requests = await _extraHourService.GetAllAsync();
            var departments = await _departmentService.GetAllAsync();
            var totalDepartments = departments.Count();

            var departmentStats = departments
            .Select(d => new DepartamentoDto
        {
            Nombre = d.Name,
            CantidadEmpleados = users.Count(u => u.DepartmentId == d.Id)
        })
            .ToList();




            return new DashboardSummaryDto
            {
                TotalUsers = users.Count(),
                ActiveUsers = users.Count(u => u.IsActive),
                PendingRequests = requests.Count(r => r.Status == "Pendiente"),
                ApprovedHoursThisMonth = (decimal)requests
                .Where(r => r.Status == "Aprobado" && r.RequestDate.Month == now.Month)
                .Sum(r => (r.EndTime - r.StartTime).TotalHours),
                ActiveDepartments = departments.Count(d => d.Status == "Activo"),
                TotalDepartments = departments.Count(),
                RecentRequests = requests
        .Where(r => r.User != null)
        .OrderByDescending(r => r.RequestDate)
        .Take(5)
        .Select(r => new RecentRequestDto
        {
            UserName = r.User.Username,
            Date = r.RequestDate,
            Status = r.Status,
            Hours = (decimal)(r.EndTime - r.StartTime).TotalHours
        })
        .ToList(),
                DepartmentStats = departmentStats
            };


        }
    }
}