using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ExtraHours.API.Models;

public class ExtraHour
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    [NotMapped]
    public double TotalHours => (EndTime - StartTime).TotalHours;

    public string Reason { get; set; } = null!;
    public string Status { get; set; } = "Pendiente";
    public string? RejectionReason { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.Now;
    public DateTime? ApprovedRejectedAt { get; set; }
    public int? ApprovedRejectedByUserId { get; set; }
    public User? ApprovedRejectedByUser { get; set; }

    public DateTime? UpdatedAt { get; set; } 
}

