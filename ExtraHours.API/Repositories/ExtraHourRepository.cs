using ExtraHours.API.Models;
using Microsoft.EntityFrameworkCore;
using ExtraHours.API.Data;

public class ExtraHourRepository : IExtraHourRepository
{
    private readonly AppDbContext _context;

    public ExtraHourRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ExtraHour>> GetAllAsync()
    {
        return await _context.ExtraHours
        .Include(r => r.User)
        .Include(r => r.ApprovedRejectedByUser)
        .ToListAsync();
    }

    public async Task<ExtraHour?> GetByIdAsync(int id)
    {
        return await _context.ExtraHours.FindAsync(id);
    }

    public async Task<IEnumerable<ExtraHour>> GetRecentAsync(int count)
    {
        return await _context.ExtraHours
            .Include(x => x.User)
            .OrderByDescending(x => x.Date)
            .Take(count)
            .ToListAsync();
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

        existing.Status = extraHour.Status;
        existing.Date = extraHour.Date;
        existing.StartTime = extraHour.StartTime;
        existing.EndTime = extraHour.EndTime;
        existing.Reason = extraHour.Reason;
        existing.RejectionReason = extraHour.RejectionReason;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }


    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.ExtraHours.FindAsync(id);
        if (existing == null) return false;
        _context.ExtraHours.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<IEnumerable<ExtraHour>> GetByUserIdAsync(int userId)
{
    return await _context.ExtraHours
        .Include(eh => eh.User)
        .Include(eh => eh.ApprovedRejectedByUser)
        .Where(eh => eh.UserId == userId)
        .OrderByDescending(eh => eh.Date)
        .ToListAsync();
}

}