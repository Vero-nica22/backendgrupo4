using ExtraHours.API.Models;
using ExtraHours.API.DTOs;
using ExtraHours.API.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace ExtraHours.API.Services;

public class ExtraHourRequestService : IExtraHourRequestService
{
    private readonly IExtraHourRequestRepository _repository;

    public ExtraHourRequestService(IExtraHourRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<ExtraHourRequest> CreateAsync(int userId, ExtraHourRequestCreateDto requestDto)
    {
        var newRequest = new ExtraHourRequest
        {
            UserId = userId,
            DateOfExtraHours = requestDto.DateOfExtraHours,
            StartTime = requestDto.StartTime,
            EndTime = requestDto.EndTime,
            // ExtraHourTypeId = requestDto.ExtraHourTypeId,
            Reason = requestDto.Reason,
            Status = "Pendiente",
            RequestDate = DateTime.UtcNow,
            AdminComments = string.Empty
        };

        return await _repository.CreateAsync(newRequest);
    }

    public Task<ExtraHourRequest?> GetByIdAsync(int id)
        => _repository.GetByIdAsync(id);

    public Task<IEnumerable<ExtraHourRequest>> GetAllAsync()
        => _repository.GetAllAsync();
}