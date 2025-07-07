using System.ComponentModel.DataAnnotations.Schema;
using ExtraHours.API.Models;


public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Employees { get; set; }

    [NotMapped]
    public int TotalExtraHours { get; set; }

    public string Status { get; set; } = "Activo";

    public ICollection<User> Users { get; set; } = new List<User>();
}
