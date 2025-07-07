namespace ExtraHours.API.DTOs
{
    public class DashboardSummaryDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int PendingRequests { get; set; }
        public decimal ApprovedHoursThisMonth { get; set; }

        public List<RecentRequestDto> RecentRequests { get; set; } = new();

        public int ActiveDepartments { get; set; }
        public List<DepartamentoDto> DepartmentStats { get; set; } = new();


        public int TotalDepartments { get; set; }

    }

    public class RecentRequestDto
    {
        public string UserName { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; }
        public decimal Hours { get; set; }


    }
}