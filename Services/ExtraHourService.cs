using ExtraHours.API.Data;
using ExtraHours.API.Models;
using Microsoft.EntityFrameworkCore;

public class ExtraHourService : IExtraHourService
{
    private readonly AppDbContext _context;

    public ExtraHourService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ExtraHour>> GetAllAsync()
    {
        return await _context.ExtraHours.ToListAsync();
    }

    public async Task<ExtraHour?> GetByIdAsync(int id)
    {
        return await _context.ExtraHours.FindAsync(id);
    }

    public async Task<ExtraHour> CreateAsync(ExtraHour extraHour)
    {
        _context.ExtraHours.Add(extraHour);
        await _context.SaveChangesAsync();
        return extraHour;
    }

    public async Task<ExtraHour?> UpdateAsync(int id, ExtraHour extraHour)
    {
        var existing = await _context.ExtraHours.FindAsync(id);
        if (existing == null) return null;
        existing.Date = extraHour.Date;
        existing.StartTime = extraHour.StartTime;
        existing.EndTime = extraHour.EndTime;
        existing.Reason = extraHour.Reason;
        existing.Status = extraHour.Status;
        existing.RejectionReason = extraHour.RejectionReason;
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var extraHour = await _context.ExtraHours.FindAsync(id);
        if (extraHour == null) return false;
        _context.ExtraHours.Remove(extraHour);
        await _context.SaveChangesAsync();
        return true;
    }
}