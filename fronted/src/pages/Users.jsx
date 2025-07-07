import React, { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  const [currentUser, setCurrentUser] = useState({
    id: null,
    username: "",
    email: "",
    role: "",
    departmentId: "",
    position: "",
    isActive: true,
    password: "",
    firstName: "",
    lastName: "",
    profilePictureUrl: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = localStorage.getItem("authToken");

      const headers = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch("http://localhost:5023/api/users", {
        method: "GET",
        headers: headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Error HTTP: ${res.status} ${res.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.detail || errorText;
        } catch (jsonError) {
          console.error(jsonError);
          console.warn("La respuesta de error no es JSON:", errorText);
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        // Mapeamos los datos para incluir el nombre del departamento
        const usersWithDepartmentNames = await Promise.all(data.map(async user => {
          // Si el usuario tiene un departmentId, obtenemos el nombre del departamento
          let departmentName = "Sin departamento";
          if (user.departmentId) {
            try {
              const deptRes = await fetch(`http://localhost:5023/api/departments/${user.departmentId}`);
              if (deptRes.ok) {
                const deptData = await deptRes.json();
                departmentName = deptData.name;
              }
            } catch (err) {
              console.error("Error al obtener el departamento:", err);
            }
          }

          return {
            ...user,
            departmentName: departmentName
          };
        }));

        setUsers(usersWithDepartmentNames);
      } else {
        console.warn(
          "La respuesta de GET users no es JSON o está vacía.",
          await res.text()
        );
        setUsers([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching users:", err);
      if (err.message.includes("401 Unauthorized")) {
        alert(
          "Sesión expirada o no autorizado. Por favor, inicie sesión de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:5023/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartmentsList(data);
      } else {
        console.error("Error al cargar departamentos:", res.statusText);
        setDepartmentsList([]);
      }
    } catch (err) {
      console.error("Error al cargar departamentos:", err);
      setDepartmentsList([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      // Crear una URL de vista previa para la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setCurrentUser({
          ...currentUser,
          profilePictureUrl: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (user = null) => {
    setIsModalOpen(true);
    setSelectedFile(null);
    setPreviewImage("");

    if (user) {
      setIsEditMode(true);
      setCurrentUser({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId ?? "",
        position: user.position || "",
        isActive: user.isActive,
        password: "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profilePictureUrl: user.profilePictureUrl || "",
      });

      if (user.profilePictureUrl) {
        setPreviewImage(user.profilePictureUrl);
      }
    } else {
      setIsEditMode(false);
      setCurrentUser({
        id: null,
        username: "",
        email: "",
        role: "",
        departmentId: "",
        position: "",
        isActive: true,
        password: "",
        firstName: "",
        lastName: "",
        profilePictureUrl: "",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser({
      id: null,
      username: "",
      email: "",
      role: "",
      departmentId: "",
      position: "",
      isActive: true,
      password: "",
      firstName: "",
      lastName: "",
      profilePictureUrl: "",
    });
    setSelectedFile(null);
    setPreviewImage("");
  };

  const handleSaveUser = async () => {
    try {
      let res;
      const authToken = localStorage.getItem("authToken");
      const headers = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const userPayload = {
        username: currentUser.username,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        role: currentUser.role,
        departmentId: currentUser.departmentId ? parseInt(currentUser.departmentId) : null,
        position: currentUser.position,
        isActive: currentUser.isActive,
        profilePictureUrl: currentUser.profilePictureUrl,
      };

      if (isEditMode) {
        userPayload.id = currentUser.id;
        res = await fetch(`http://localhost:5023/api/users/${currentUser.id}`, {
          method: "PUT",
          headers: headers,
          body: JSON.stringify(userPayload),
        });
      } else {
        if (
          !userPayload.username ||
          !userPayload.email ||
          !currentUser.password ||
          !userPayload.role
        ) {
          alert(
            "Los campos Usuario, Email, Contraseña y Rol son requeridos para un nuevo usuario."
          );
          return;
        }

        userPayload.password = currentUser.password;

        res = await fetch("http://localhost:5023/api/users", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(userPayload),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Error HTTP: ${res.status} ${res.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.message ||
            errorData.detail ||
            JSON.stringify(errorData.errors) ||
            errorText;
        } catch (jsonError) {
          console.error(jsonError);
          console.warn("La respuesta de error no es JSON:", errorText);
        }
        throw new Error(errorMessage);
      }

      fetchUsers();
      handleCloseModal();
    } catch (err) {
      alert("Error al guardar el usuario: " + err.message);
      console.error("Error saving user:", err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-700">Cargando usuarios...</div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Gestión de Usuarios
      </h1>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors shadow-md"
        >
          Crear Nuevo Usuario
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Usuario</th>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Email</th>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Rol</th>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Departamento</th>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Puesto</th>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Estado</th>
              <th className="py-2 px-2 text-left text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2 text-gray-800">{user.id}</td>
                  <td className="py-2 px-2 text-gray-800">{user.username}</td>
                  <td className="py-2 px-2 text-gray-800">{user.email}</td>
                  <td className="py-2 px-2 text-gray-800">{user.role}</td>
                  <td className="py-2 px-2 text-gray-800">{user.departmentName}</td>
                  <td className="py-2 px-2 text-gray-800">
                    {user.position}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={
                        user.isActive
                          ? "px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                          : "px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                      }
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-2 px-2 flex justify-start space-x-2">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                      title="Editar"
                    >
                      <FiEdit size={20} /> Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-xl mx-auto h-auto overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-3">
          {isEditMode ? "Editar Usuario" : "Nuevo Usuario"}
        </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Nombre de Usuario</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                    value={currentUser.username}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, username: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                    value={currentUser.email}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, email: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                      value={currentUser.firstName}
                      onChange={(e) =>
                        setCurrentUser({ ...currentUser, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Apellido</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                      value={currentUser.lastName}
                      onChange={(e) =>
                        setCurrentUser({ ...currentUser, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                {!isEditMode && (
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Contraseña</label>
                    <input
                      type="password"
                      className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                      value={currentUser.password}
                      onChange={(e) =>
                        setCurrentUser({ ...currentUser, password: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Rol</label>
                    <select
                      className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                      value={currentUser.role}
                      onChange={(e) =>
                        setCurrentUser({ ...currentUser, role: e.target.value })
                      }
                    >
                      <option value="">Selecciona un rol</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Departamento</label>
                    <select
                      className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                      value={currentUser.departmentId || ""}
                      onChange={(e) =>
                        setCurrentUser({ ...currentUser, departmentId: e.target.value })
                      }
                    >
                      <option value="">Selecciona un departamento</option>
                      {departmentsList.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1">Puesto</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                    value={currentUser.position}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, position: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1">
                    Imagen de Perfil (opcional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors">
                      Seleccionar imagen
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    {previewImage && (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                        <img
                          src={previewImage}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Archivo seleccionado: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1">Estado</label>
                  <select
                    className="w-full px-2 py-1 border rounded bg-white text-gray-900 text-sm"
                    value={currentUser.isActive}
                    onChange={(e) => {
                      const updatedStatus = e.target.value === "true";
                      setCurrentUser({ ...currentUser, isActive: updatedStatus });
                    }}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

         <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
          <button
            onClick={handleCloseModal}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors text-base w-full sm:w-auto"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveUser}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors text-base w-full sm:w-auto"
          >
            {isEditMode ? "Guardar Cambios" : "Crear Usuario"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Users;