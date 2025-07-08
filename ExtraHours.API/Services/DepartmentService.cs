using ExtraHours.API.Repositories;


public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _repository;

    public DepartmentService(IDepartmentRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<Department>> GetAllAsync()
        => _repository.GetAllAsync();

    public Task<Department?> GetByIdAsync(int id)
        => _repository.GetByIdAsync(id);

    public Task<Department> CreateAsync(Department department)
        => _repository.CreateAsync(department);

    public Task<Department?> UpdateAsync(int id, Department department)
        => _repository.UpdateAsync(id, department);

    public Task<bool> DeleteAsync(int id)
        => _repository.DeleteAsync(id);
}