
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ExtraHours.API.Models;

public class ExtraHour
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }


    [NotMapped]
    public double TotalHours => (EndTime - StartTime).TotalHours;

    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = null!;


    [Required]
    public string Status { get; set; } = "Pendiente";

    public string? RejectionReason { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.Now;
    public DateTime? ApprovedRejectedAt { get; set; }

    public int? ApprovedRejectedByUserId { get; set; }
    public User? ApprovedRejectedByUser { get; set; }

}