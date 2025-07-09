import React, { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle, XCircle, FileText, StickyNote } from "lucide-react";

const Requests = () => {
  const [filter, setFilter] = useState("Todos los estados");
  const [extraHourType, setExtraHourType] = useState("");
  const [notes, setNotes] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userNames, setUserNames] = useState({});
  const [modalMode, setModalMode] = useState("manageRequest");
  // "manageRequest" o "viewReason"
  const itemsPerPage = 5;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const determineHourType = (date, startTime, endTime) => {
    if (!date || !startTime || !endTime) {
      return { type: 'normal' };
    }

    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const dateObj = new Date(date);
    const isSunday = dateObj.getDay() === 0;

    const holidays = [
      '2023-01-01', '2023-01-09', '2023-03-20', '2023-04-06',
      '2023-04-07', '2023-04-09', '2023-05-01', '2023-05-22',
      '2023-06-12', '2023-06-19', '2023-07-03', '2023-07-20',
      '2023-08-07', '2023-08-21', '2023-10-16', '2023-11-06',
      '2023-11-13', '2023-12-08', '2023-12-25'
    ];
    const dateString = dateObj.toISOString().split('T')[0];
    const isHoliday = holidays.includes(dateString);

    const NIGHT_START = 21;
    const NIGHT_END = 6;

    let nightMinutes = 0;
    let current = new Date(start);
    while (current < end) {
      const hour = current.getHours();
      if (hour >= NIGHT_START || hour < NIGHT_END) {
        nightMinutes += 1;
      }
      current.setMinutes(current.getMinutes() + 1);
    }

    const nightRatio = nightMinutes / ((end - start) / (1000 * 60));
    if (isHoliday) return { type: 'festiva' };
    if (isSunday) return { type: 'dominical' };
    if (nightRatio >= 0.5) return { type: 'nocturna' };
    return { type: 'normal' };
  };

  useEffect(() => {
    fetchRequests();

    if (selectedRequest?.userId && !userNames[selectedRequest.userId]) {
      fetchUserName(selectedRequest.userId);
    }
  }, [filter, extraHourType, startDate, endDate, currentPage, selectedRequest]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5023/api/extrahours", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const enrichedData = data.map((req) => ({
        ...req,
        hourType: determineHourType(req.date, req.startTime, req.endTime).type
      }));
      setRequests(enrichedData);

    } catch (err) {
      setError("Error al cargar las solicitudes: " + err.message);
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };


  const filteredRequests = requests.filter((request) => {
    const requestDate = new Date(request.date);
    const filterStartDate = startDate ? new Date(startDate) : null;
    const filterEndDate = endDate ? new Date(endDate) : null;

    const isWithinDateRange =
      (!filterStartDate || requestDate >= filterStartDate) &&
      (!filterEndDate || requestDate <= filterEndDate);

    if (!isWithinDateRange) return false;

    if (filter === "Todos los estados") return true;
    if (filter === "Pendiente" && request.status === "Pendiente") return true;
    if (filter === "Aprobado" && request.status === "Aprobado") return true;
    if (filter === "Rechazado" && request.status === "Rechazado") return true;

if (
  filter === "Tipo de Hora" &&
  extraHourType &&
  request.hourType === extraHourType
)
  return true;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddNote = (request) => {
    setSelectedRequest(request);
    setNoteInput(request.rejectionReason || notes[request.id] || "");
    setIsEditingNote(
      request.status === "Pendiente" || request.status === "Rechazado"
    );
    fetchUserName(request.userId); // 👈 Aquí se carga el nombre
  };


  function getCurrentUserIdFromToken() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return parseInt(payload.nameid);
    } catch {
      return null;
    }
  }


  const handleSaveNote = async () => {
    if (!selectedRequest) return;

    const updatedRequest = {
      id: selectedRequest.id,
      userId: selectedRequest.userId,
      date: selectedRequest.date,
      startTime: selectedRequest.startTime,
      endTime: selectedRequest.endTime,
      reason: selectedRequest.reason,
      status: selectedRequest.status,
      rejectionReason: noteInput,
      requestedAt: selectedRequest.requestedAt,
      approvedRejectedAt: new Date().toISOString(),
      approvedRejectedByUserId: getCurrentUserIdFromToken()
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No estás autenticado. Por favor, inicia sesión.");
        return;
      }

      const res = await fetch(
        `http://localhost:5023/api/extrahours/${selectedRequest.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Incluye el token
          },
          body: JSON.stringify(updatedRequest),
        }
      );

      if (res.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id ? updatedRequest : req
          )
        );
        setNotes({ ...notes, [selectedRequest.id]: noteInput });
        setSelectedRequest(null);
        setIsEditingNote(false);
        fetchRequests();
      } else {
        const errorText = await res.text(); // ✅ Evita fallo con res.json() vacío
        alert(
          "Error al guardar la nota: " + (errorText || res.statusText)
        );
      }
    } catch (err) {
      alert("Error de conexión al guardar la nota: " + err.message);
      console.error("Error saving note:", err);
    }
  };

  const fetchUserName = async (userId) => {
    if (userNames[userId]) return; // Ya lo tenemos

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5023/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const user = await res.json();
        setUserNames((prev) => ({
          ...prev,
          [userId]: {
            fullName: `${user.firstName} ${user.lastName}`,
            department: user.departmentName ?? "Sin departamento",
          },
        }));
      } else {
        console.error(`Error al obtener usuario: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error("Error al obtener el nombre del usuario:", err);
    }
  };

  const handleCloseNote = () => {
    setSelectedRequest(null);
    setIsEditingNote(false);
  };

  const handleEditNote = () => {
    setIsEditingNote(true);
  };

  const updateRequestStatus = async (id, newStatus) => {
    const requestToUpdate = requests.find((req) => req.id === id);
    if (!requestToUpdate) {
      alert("Solicitud no encontrada.");
      return;
    }

    const updatedRequest = {
      id: requestToUpdate.id,
      userId: requestToUpdate.userId,
      date: requestToUpdate.date,
      startTime: requestToUpdate.startTime,
      endTime: requestToUpdate.endTime,
      reason: requestToUpdate.reason,
      status: newStatus,
      rejectionReason: newStatus === "Aprobado" ? null : requestToUpdate.rejectionReason,
      requestedAt: requestToUpdate.requestedAt,
      approvedRejectedAt: new Date().toISOString(),
      approvedRejectedByUserId: getCurrentUserIdFromToken()
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No estás autenticado. Por favor, inicia sesión.");
        return;
      }

      const res = await fetch(`http://localhost:5023/api/extrahours/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Token JWT
        },
        body: JSON.stringify(updatedRequest),
      });

      if (res.ok) {
        fetchRequests();
      } else {
        const errorText = await res.text(); // ✅ Evita fallo con res.json() vacío
        alert(
          `Error al ${newStatus === "Aprobado" ? "aprobar" : "rechazar"} la solicitud: ` +
          (errorText || res.statusText)
        );
      }
    } catch (err) {
      alert("Error de conexión: " + err.message);
      console.error("Error updating request status:", err);
    }
  };

  const handleApprove = (id) => updateRequestStatus(id, "Aprobado");
  const handleReject = (id) => updateRequestStatus(id, "Rechazado");

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setSelectedRequest((prev) => ({ ...prev, status: newStatus }));
    if (newStatus !== "Rechazado") {
      setNoteInput("");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando solicitudes...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2 mb-4">
            <CardTitle>Gestión de Solicitudes</CardTitle>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-2 mt-2 md:mt-0">
              <select
                className="border border-gray-300 rounded p-2 mb-2 md:mb-0 bg-white text-gray-900"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setExtraHourType("");
                }}
              >
                <option>Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Rechazado">Rechazado</option>
                <option value="Tipo de Hora">Tipo de Hora</option>
              </select>
         {filter === "Tipo de Hora" && (
  <select
    className="border border-gray-300 rounded p-2 mb-2 md:mb-0 bg-white text-gray-900"
    value={extraHourType}
    onChange={(e) => setExtraHourType(e.target.value)}
  >
    <option value="">Selecciona un tipo</option>
    <option value="normal">Normal</option>
    <option value="nocturna">Nocturna</option>
    <option value="festiva">Festiva</option>
    <option value="dominical">Dominical</option>
  </select>
)}
              <input
                type="date"
                className="border border-gray-300 rounded p-2 mb-2 md:mb-0 bg-white text-gray-900"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="border border-gray-300 rounded p-2 bg-white text-gray-900"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            Aprueba o rechaza solicitudes de horas extras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">ID</th>
                  <th className="py-2 px-4 border-b text-left">Usuario ID</th>
                  <th className="py-2 px-4 border-b text-left">Fecha</th>
                  <th className="py-2 px-4 border-b text-left">Hora Inicio</th>
                  <th className="py-2 px-4 border-b text-left">Hora Fin</th>
                  <th className="py-2 px-4 border-b text-left">Razón</th>
                  <th className="py-2 px-4 border-b text-left">Tipo</th>
                  <th className="py-2 px-4 border-b text-left">Estado</th>
                  <th className="py-2 px-4 border-b text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{request.id}</td>
                    <td className="py-2 px-4 border-b">{request.userId}</td>
                    <td className="py-2 px-4 border-b">
                      {new Date(request.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b">{request.startTime}</td>
                    <td className="py-2 px-4 border-b">{request.endTime}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setSelectedRequest(request);
                          setNoteInput(request.reason); // Mostrar el motivo del usuario
                          setModalMode("viewReason");
                        }}
                        title="Ver razón del usuario"
                      >
                        <StickyNote size={20} />
                      </button>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.hourType === 'nocturna' ? 'bg-purple-100 text-purple-800' :
                        request.hourType === 'festiva' ? 'bg-red-100 text-red-800' :
                          request.hourType === 'dominical' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                        {request.hourType === 'nocturna' ? 'Nocturna' :
                          request.hourType === 'festiva' ? 'Festiva' :
                            request.hourType === 'dominical' ? 'Dominical' :
                              'Normal'}
                      </span>
                    </td>

                    <td className="py-2 px-4 border-b">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${request.status === "Aprobado"
                          ? "bg-green-100 text-green-800"
                          : request.status === "Rechazado"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        {request.status === "Pendiente" ? (
                          <>
                            <button
                              className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-100 transition-colors"
                              onClick={() => handleApprove(request.id)}
                              title="Aprobar"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors"
                              onClick={() => handleReject(request.id)}
                              title="Rechazar"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-100 transition-colors"
                            onClick={() => {
                              handleAddNote(request);
                              setModalMode("manageRequest");
                            }}
                            title="Ver/Editar Nota"
                          >
                            <FileText size={20} />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <p className="text-gray-600">
              Mostrando {paginatedRequests.length} de {filteredRequests.length}{" "}
              solicitudes
            </p>
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  className={`px-3 py-1 rounded ${currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                    }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
            {/* Título del modal */}
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              {modalMode === "viewReason"
                ? "Razón de usuario"
                : selectedRequest.status === "Pendiente" || isEditingNote
                  ? "Agregar/Editar Detalles"
                  : "Detalles de la Solicitud"}
            </h2>

            {/* Información común */}
            <div className="mb-4">
              <p className="text-gray-900">
                <strong>Usuario:</strong> {selectedRequest.userId}
              </p>
              <p className="text-gray-900">
                <strong>Nombre:</strong>{" "}
                {userNames[selectedRequest?.userId]?.fullName || "Cargando..."}
              </p>

              <p className="text-gray-900">
                <strong>Departamento:</strong>{" "}
                {userNames[selectedRequest?.userId]?.department || "Cargando..."}
              </p>


              <p className="text-gray-900">
                <strong>Fecha:</strong>{" "}
                {new Date(selectedRequest.date).toLocaleDateString()}
              </p>
              <p className="text-gray-900">
                <strong>Estado Actual:</strong>
                <span
                  className={`px-2 py-1 rounded-full text-xs ml-2 ${selectedRequest.status === "Aprobado"
                    ? "bg-green-100 text-green-800"
                    : selectedRequest.status === "Rechazado"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                  {selectedRequest.status}
                </span>
              </p>
            </div>

            {modalMode === "viewReason" ? (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Motivo del usuario:
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded p-2 bg-gray-50 text-gray-900"
                    rows="4"
                    value={noteInput}
                    readOnly
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                    onClick={handleCloseNote}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="note">
                    Razón/Nota:
                  </label>
                  <textarea
                    id="note"
                    className="w-full border border-gray-300 rounded p-2 mb-2 bg-white text-gray-900"
                    rows="4"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Escribe una razón para rechazar o una nota adicional..."
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status-change">
                    Cambiar Estado:
                  </label>
                  <select
                    id="status-change"
                    className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                    value={selectedRequest.status}
                    onChange={handleStatusChange}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                    onClick={handleCloseNote}
                  >
                    Cancelar
                  </button>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    onClick={handleSaveNote}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
