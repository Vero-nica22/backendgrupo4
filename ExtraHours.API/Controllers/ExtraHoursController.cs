using Microsoft.AspNetCore.Mvc;
using ExtraHours.API.Models;
using ExtraHours.API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ExtraHoursController : ControllerBase
{
    private readonly IExtraHourService _extraHourService;

    public ExtraHoursController(IExtraHourService extraHourService)
    {
        _extraHourService = extraHourService;
    }

   [HttpGet]
public async Task<ActionResult<IEnumerable<ExtraHour>>> GetExtraHours()
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized("No se pudo identificar al usuario.");

        int userId = int.Parse(userIdClaim.Value);

        var result = await _extraHourService.GetByUserIdAsync(userId);
        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"🔥 {ex.Message} | 💥 {ex.InnerException?.Message}");
    }
}



    [HttpGet("{id}")]
    public async Task<ActionResult<ExtraHour>> GetExtraHour(int id)
    {
        try
        {
            var extraHour = await _extraHourService.GetByIdAsync(id);
            if (extraHour == null) return NotFound();
            return Ok(extraHour);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al obtener la hora extra: {ex.Message}");
        }
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecentAsync(int count = 3)
    {
        var result = await _extraHourService.GetRecentAsync(count);
        return Ok(result);
    }



    [HttpPost]
    public async Task<ActionResult<ExtraHour>> PostExtraHour([FromBody] ExtraHour extraHour)
    {
        try
        {
            var created = await _extraHourService.CreateAsync(extraHour);
            return CreatedAtAction(nameof(GetExtraHour), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al crear la hora extra: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutExtraHour(int id, [FromBody] ExtraHour extraHour)
    {
        try
        {
            var updated = await _extraHourService.UpdateAsync(id, extraHour);
            if (updated == null) return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al actualizar la hora extra: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExtraHour(int id)
    {
        try
        {
            var deleted = await _extraHourService.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al eliminar la hora extra: {ex.Message}");
        }
    }
}