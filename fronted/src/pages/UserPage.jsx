import React, { useEffect, useState, useMemo } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  Mail,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Menu,
  X,
  CalendarDays,
  Hourglass,
  AlertTriangle,
  CheckCircle,
  FileText,
  StickyNote,
  Clock,
  AlertOctagon,
  Moon,
  PartyPopper,
  Sun
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import authService from "../services/authService";

const UserPage = () => {
  const { isLightTheme } = useTheme();
  const [extraHours, setExtraHours] = useState([]);
  const [newHour, setNewHour] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    status: "Pendiente",
  });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ reason: "" });
  const [selectedNote, setSelectedNote] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [adminEmails, setAdminEmails] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hourToDelete, setHourToDelete] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showLegalLimitModal, setShowLegalLimitModal] = useState(false);
  const [showFutureDateModal, setShowFutureDateModal] = useState(false);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [userNames, setUserNames] = useState({});




  const currentUser = authService.getCurrentUser();
  const currentUserId = currentUser?.userId;

  const mockCurrentUserDetails = {
    userId: "user123",
    name: currentUser?.username || "Usuario Desconocido",
    email: currentUser?.email || "juan.perez@company.com",
    role: "Empleado",
    department: "Desarrollo",
    position: "Desarrollador",
    profilePicture: "https://via.placeholder.com/100/3B82F6/FFFFFF?text=JP",
  };

  const colors = {
    light: {
      primary: "#3B82F6",
      accent: "#10B981",
      background: "#F9FAFB",
      cardBackground: "#FFFFFF",
      text: "#1F2937",
      subtleText: "#6B7280",
      border: "#E5E7EB",
      iconBackground: "#EFF6FF",
      inputBackground: "#FFFFFF",
      inputBorder: "#D1D5DB",
      buttonPrimaryBg: "#3B82F6",
      buttonPrimaryText: "white",
      buttonDangerBg: "#EF4444",
      buttonDangerText: "white",
      buttonSecondaryBg: "#6B7280",
      buttonSecondaryText: "white",
      summaryCardBg: "#FFFFFF",
      summaryCardBorder: "#E5E7EB",
      summaryCardText: "#1F2937",
      summaryIconBg: "#EFF6FF",
      summaryIconColor: "#3B82F6",
    },
    dark: {
      primary: "#60A5FA",
      accent: "#34D399",
      background: "#1F2937",
      cardBackground: "#111827",
      text: "#F9FAFB",
      subtleText: "#9CA3AF",
      border: "#374151",
      iconBackground: "#1E40AF",
      inputBackground: "#1F2937",
      inputBorder: "#4B5563",
      buttonPrimaryBg: "#60A5FA",
      buttonPrimaryText: "white",
      buttonDangerBg: "#DC2626",
      buttonDangerText: "white",
      buttonSecondaryBg: "#4B5563",
      buttonSecondaryText: "white",
      summaryCardBg: "#111827",
      summaryCardBorder: "#374151",
      summaryCardText: "#F9FAFB",
      summaryIconBg: "#1E40AF",
      summaryIconColor: "#60A5FA",
    },
  };
  const currentTheme = isLightTheme ? colors.light : colors.dark;

 useEffect(() => {
  if (currentUserId) {
    fetchExtraHours();
  } else {
    setExtraHours([]);
  }
}, [currentUserId]);


const fetchUserName = async (userId) => {
  if (userNames[userId]) return;

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


  const fetchAdminEmail = async (adminId) => {
    if (!adminId) return "No especificado";
    if (adminEmails[adminId]) return adminEmails[adminId];

    try {
      const res = await fetch(`http://localhost:5023/api/users/${adminId}`);
      if (res.ok) {
        const data = await res.json();
        setAdminEmails(prev => ({ ...prev, [adminId]: data.email }));
        return data.email;
      }
      return `ID: ${adminId}`;
    } catch (error) {
      console.error("Error al obtener email del administrador:", error);
      return `ID: ${adminId}`;
    }
  };

  const fetchExtraHours = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    const res = await fetch("http://localhost:5023/api/extrahours", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    const hoursWithType = data.map((hour) => {
      const hourTypeInfo = determineHourType(hour.date, hour.startTime, hour.endTime);
      return {
        ...hour,
        hourType: hourTypeInfo.type,
        isNightTime: hourTypeInfo.isNightTime,
        isHoliday: hourTypeInfo.isHoliday,
        isSunday: hourTypeInfo.isSunday,
      };
    });

    setExtraHours(hoursWithType);

    // 🔁 Cargar nombres de usuarios y administradores
    hoursWithType.forEach((hour) => {
      if (hour.userId && !userNames[hour.userId]) {
        fetchUserName(hour.userId);
      }
      if (hour.approvedRejectedByUserId && !userNames[hour.approvedRejectedByUserId]) {
        fetchUserName(hour.approvedRejectedByUserId);
      }
    });

  } catch (error) {
    console.error("Error al cargar las horas extras: ", error);
    alert("Error al cargar tus horas extras. Inténtalo de nuevo.");
  }
};

  const handleInputChange = (e) => {
    setNewHour({ ...newHour, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const determineHourType = (date, startTime, endTime) => {
    if (!date || !startTime || !endTime) {
      return { type: 'normal', isNightTime: false, isHoliday: false, isSunday: false };
    }

    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

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

    const totalDuration = (end - start) / (1000 * 60 * 60);

    // 1. Festivo
    if (isHoliday) {
      return { type: 'festiva', isHoliday: true, isNightTime: false, isSunday: false };
    }

    // 2. Domingo
    if (isSunday) {
      return { type: 'dominical', isHoliday: false, isNightTime: false, isSunday: true };
    }

    // 3. Nocturna (si más del 50% del tiempo está entre 9pm y 6am)
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
    if (nightRatio >= 0.5) {
      return { type: 'nocturna', isHoliday: false, isNightTime: true, isSunday: false };
    }

    // 4. Normal
    return { type: 'normal', isHoliday: false, isNightTime: false, isSunday: false };
  };

  const validateExtraHours = (date, startTime, endTime) => {
    const errors = {};
    const start = new Date(`2000/01/01 ${startTime}`);
    let end = new Date(`2000/01/01 ${endTime}`);

    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    if (start >= end) {
      errors.time = "La hora de inicio debe ser anterior a la hora de fin";
      return { isValid: false, errors };
    }

    const durationHours = (end - start) / (1000 * 60 * 60);

    const hourType = determineHourType(date, startTime, endTime);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      durationHours,
      ...hourType
    };
  };

  const calculateDuration = (startTime, endTime) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startDate = new Date(0, 0, 0, startH, startM);
    let endDate = new Date(0, 0, 0, endH, endM);

    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const diffMs = endDate - startDate;
    return diffMs / (1000 * 60 * 60);
  };

  const addExtraHour = async () => {
  if (!currentUserId) {
    alert("Error: No hay un usuario logeado para registrar horas extras.");
    return;
  }

  if (!newHour.date || !newHour.startTime || !newHour.endTime || !newHour.reason) {
    setValidationErrors({
      general: "Por favor completa todos los campos marcados como obligatorios"
    });
    return;
  }

  const validation = validateExtraHours(newHour.date, newHour.startTime, newHour.endTime);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (newHour.date > todayStr) {
    setShowFutureDateModal(true);
    return;
  }

  if (!validation.isValid) {
    setValidationErrors(validation.errors);
    return;
  }

  const newDuration = validation.durationHours;

  const sameDayHours = extraHours.filter((h) => {
    const hDate = new Date(h.date).toISOString().split("T")[0];
    const newDate = new Date(newHour.date).toISOString().split("T")[0];
    return h.userId === currentUserId && hDate === newDate;
  });

  const newStart = new Date(`2000-01-01T${newHour.startTime}`);
  let newEnd = new Date(`2000-01-01T${newHour.endTime}`);
  if (newEnd <= newStart) newEnd.setDate(newEnd.getDate() + 1);

  const overlaps = sameDayHours.some((h) => {
    const existingStart = new Date(`2000-01-01T${h.startTime}`);
    let existingEnd = new Date(`2000-01-01T${h.endTime}`);
    if (existingEnd <= existingStart) existingEnd.setDate(existingEnd.getDate() + 1);
    return newStart < existingEnd && newEnd > existingStart;
  });

  if (overlaps) {
  setShowOverlapModal(true);
  return;
}


  const totalSameDay = sameDayHours.reduce(
    (sum, h) => sum + calculateDuration(h.startTime, h.endTime),
    0
  );

  if (totalSameDay >= 2 || newDuration > 2 || totalSameDay + newDuration > 2) {
    setShowLegalLimitModal(true);
    return;
  }

  const newDate = new Date(newHour.date);
  const startOfWeek = new Date(newDate);
  startOfWeek.setDate(newDate.getDate() - newDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const sameWeekHours = extraHours.filter((h) => {
    const hDate = new Date(h.date);
    return (
      h.userId === currentUserId &&
      hDate >= startOfWeek &&
      hDate <= endOfWeek
    );
  });

  const totalWeek = sameWeekHours.reduce(
    (sum, h) => sum + calculateDuration(h.startTime, h.endTime),
    0
  );

  if (totalWeek + newDuration > 12) {
    setShowLegalLimitModal(true);
    return;
  }

  try {
    const token = localStorage.getItem("token"); // ✅ Obtiene el token

    const extraHourData = {
      ...newHour,
      userId: currentUserId,
      status: "Pendiente",
      duration: newDuration,
      isNightTime: validation.isNightTime,
      isHoliday: validation.isHoliday,
      isSunday: validation.isSunday,
      hourType: validation.type
    };

    const res = await fetch("http://localhost:5023/api/extrahours", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` // ✅ Incluye el token
      },
      body: JSON.stringify(extraHourData),
    });

    if (res.ok) {
      fetchExtraHours();
      setNewHour({
        date: "",
        startTime: "",
        endTime: "",
        reason: "",
        status: "Pendiente",
      });
      setValidationErrors({});
      setShowRegisterForm(false);
    } else {
      const errorData = await res.json();
      alert(`Error al agregar la hora extra: ${errorData.message || 'Error desconocido'}`);
    }
  } catch (error) {
    console.error("Error de conexión al agregar: ", error);
    alert("Error de conexión al agregar: " + error.message);
  }
};


  const handleEditInit = (hour) => {
    if (hour.userId === currentUserId && hour.status === "Pendiente") {
      setEditId(hour.id);
      setEditData({ reason: hour.reason });
    } else if (hour.userId !== currentUserId) {
      alert("No tienes permisos para editar esta hora extra.");
    } else {
      alert("Las horas extras Aprobadas o Rechazadas no pueden ser editadas.");
    }
  };

  const handleEditSave = async (id) => {
    const extraHourToUpdate = extraHours.find((hour) => hour.id === id);

    if (!extraHourToUpdate) {
      alert("No se encontró la hora extra a actualizar.");
      return;
    }

    if (
      extraHourToUpdate.userId !== currentUserId ||
      extraHourToUpdate.status !== "Pendiente"
    ) {
      alert(
        "No tienes permisos para modificar esta hora extra o su estado no lo permite."
      );
      setEditId(null);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5023/api/extrahours/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: extraHourToUpdate.id,
          userId: extraHourToUpdate.userId,
          date: extraHourToUpdate.date,
          startTime: extraHourToUpdate.startTime,
          endTime: extraHourToUpdate.endTime,
          reason: editData.reason,
          status: extraHourToUpdate.status,
          rejectionReason: extraHourToUpdate.rejectionReason,
          approvedRejectedAt: extraHourToUpdate.approvedRejectedAt,
          approvedRejectedByUserId: extraHourToUpdate.approvedRejectedByUserId,
          isNightTime: extraHourToUpdate.isNightTime,
          isHoliday: extraHourToUpdate.isHoliday,
          isSunday: extraHourToUpdate.isSunday,
          hourType: extraHourToUpdate.hourType
        }),
      });
      if (res.ok) {
        fetchExtraHours();
        setEditId(null);
      } else {
        alert("Error al actualizar la hora extra");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor: ", error);
      alert("Error al conectar con el servidor: " + error.message);
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleDeleteClick = (hourId) => {
    setHourToDelete(hourId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
  if (!hourToDelete) return;

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado. Por favor, inicia sesión.");
      return;
    }

    const res = await fetch(`http://localhost:5023/api/extrahours/${hourToDelete}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`, // ✅ Incluye el token
      },
    });

    if (res.ok) {
      fetchExtraHours();
      setShowDeleteModal(false);
      setHourToDelete(null);
    } else {
      const errorText = await res.text();
      alert("Error al eliminar la hora extra: " + (errorText || res.statusText));
    }
  } catch (error) {
    console.error("Error al conectar con el servidor: ", error);
    alert("Error al conectar con el servidor: " + error.message);
  }
};

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setHourToDelete(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Aprobado":
        return <CheckCircle className="text-green-500" size={16} />;
      case "Rechazado":
        return <XCircle className="text-red-500" size={16} />;
      case "Pendiente":
        return <AlertCircle className="text-yellow-500" size={16} />;
      default:
        return null;
    }
  };

  const summaryData = useMemo(() => {
    let totalHours = 0;
    let approvedHours = 0;
    let pendingHours = 0;
    let nightHours = 0;
    let holidayHours = 0;
    let sundayHours = 0;
    let normalHours = 0;

    extraHours.forEach((hour) => {
      const duration = calculateDuration(hour.startTime, hour.endTime);
      totalHours += duration;

      if (hour.status === "Aprobado") {
        approvedHours += duration;
      } else if (hour.status === "Pendiente") {
        pendingHours += duration;
      }

      // Calcular por tipo de hora
      switch (hour.hourType) {
        case 'nocturna':
          nightHours += duration;
          break;
        case 'festiva':
          holidayHours += duration;
          break;
        case 'dominical':
          sundayHours += duration;
          break;
        default:
          normalHours += duration;
      }
    });

    return {
      totalHours: totalHours.toFixed(1),
      approvedHours: approvedHours.toFixed(1),
      pendingHours: pendingHours.toFixed(1),
      nightHours: nightHours.toFixed(1),
      holidayHours: holidayHours.toFixed(1),
      sundayHours: sundayHours.toFixed(1),
      normalHours: normalHours.toFixed(1)
    };
  }, [extraHours]);

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-200"
      style={{ backgroundColor: currentTheme.background }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                src={mockCurrentUserDetails.profilePicture}
                alt="Foto de Perfil"
                className="w-16 h-16 rounded-full object-cover border-4"
                style={{ borderColor: currentTheme.primary }}
              />
            </div>
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: currentTheme.text }}
              >
                {mockCurrentUserDetails.name}
              </h1>
              <div
                className="flex items-center text-sm"
                style={{ color: currentTheme.subtleText }}
              >
                <Mail size={16} className="mr-1" />
                <span>{mockCurrentUserDetails.email}</span>
                <span className="mx-2 text-gray-400">|</span>
                <Briefcase size={16} className="mr-1" />
                <span>{mockCurrentUserDetails.department}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowRegisterForm(true)}
            className="flex items-center px-4 py-2 rounded-md font-semibold shadow-md transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: currentTheme.buttonPrimaryBg,
              color: currentTheme.buttonPrimaryText,
            }}
          >
            <PlusCircle size={20} className="mr-2" /> Registrar Horas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {/* Card de Horas Totales */}
          <div className="p-4 rounded-xl border shadow-sm flex items-center space-x-4" style={{ borderColor: currentTheme.summaryCardBorder, backgroundColor: currentTheme.summaryCardBg }}>
            <div className="p-3 rounded-full" style={{ backgroundColor: currentTheme.summaryIconBg, color: currentTheme.summaryIconColor }}>
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="text-sm" style={{ color: currentTheme.subtleText }}>Total Horas</p>
              <p className="text-2xl font-bold" style={{ color: currentTheme.summaryCardText }}>{summaryData.totalHours}</p>
            </div>
          </div>

          {/* Card de Horas Aprobadas */}
          <div className="p-4 rounded-xl border shadow-sm flex items-center space-x-4" style={{ borderColor: currentTheme.summaryCardBorder, backgroundColor: currentTheme.summaryCardBg }}>
            <div className="p-3 rounded-full" style={{ backgroundColor: currentTheme.summaryIconBg, color: currentTheme.summaryIconColor }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm" style={{ color: currentTheme.subtleText }}>Horas Aprobadas</p>
              <p className="text-2xl font-bold" style={{ color: currentTheme.summaryCardText }}>{summaryData.approvedHours}</p>
            </div>
          </div>

          {/* Card de Horas Pendientes */}
          <div className="p-4 rounded-xl border shadow-sm flex items-center space-x-4" style={{ borderColor: currentTheme.summaryCardBorder, backgroundColor: currentTheme.summaryCardBg }}>
            <div className="p-3 rounded-full" style={{ backgroundColor: currentTheme.summaryIconBg, color: currentTheme.summaryIconColor }}>
              <Hourglass size={24} />
            </div>
            <div>
              <p className="text-sm" style={{ color: currentTheme.subtleText }}>Horas Pendientes</p>
              <p className="text-2xl font-bold" style={{ color: currentTheme.summaryCardText }}>{summaryData.pendingHours}</p>
            </div>
          </div>

          {/* Card de Horas Nocturnas */}
          <div className="p-4 rounded-xl border shadow-sm flex items-center space-x-4" style={{ borderColor: currentTheme.summaryCardBorder, backgroundColor: currentTheme.summaryCardBg }}>
            <div className="p-3 rounded-full" style={{ backgroundColor: currentTheme.summaryIconBg, color: currentTheme.summaryIconColor }}>
              <Moon size={24} />
            </div>
            <div>
              <p className="text-sm" style={{ color: currentTheme.subtleText }}>Horas Nocturnas</p>
              <p className="text-2xl font-bold" style={{ color: currentTheme.summaryCardText }}>{summaryData.nightHours}</p>
            </div>
          </div>

          {/* Card de Horas Festivas */}
          <div className="p-4 rounded-xl border shadow-sm flex items-center space-x-4" style={{ borderColor: currentTheme.summaryCardBorder, backgroundColor: currentTheme.summaryCardBg }}>
            <div className="p-3 rounded-full" style={{ backgroundColor: currentTheme.summaryIconBg, color: currentTheme.summaryIconColor }}>
              <PartyPopper size={24} />
            </div>
            <div>
              <p className="text-sm" style={{ color: currentTheme.subtleText }}>Horas Festivas</p>
              <p className="text-2xl font-bold" style={{ color: currentTheme.summaryCardText }}>{summaryData.holidayHours}</p>
            </div>
          </div>

          {/* Card de Horas Dominicales */}
          <div className="p-4 rounded-xl border shadow-sm flex items-center space-x-4" style={{ borderColor: currentTheme.summaryCardBorder, backgroundColor: currentTheme.summaryCardBg }}>
            <div className="p-3 rounded-full" style={{ backgroundColor: currentTheme.summaryIconBg, color: currentTheme.summaryIconColor }}>
              <Sun size={24} />
            </div>
            <div>
              <p className="text-sm" style={{ color: currentTheme.subtleText }}>Horas Dominicales</p>
              <p className="text-2xl font-bold" style={{ color: currentTheme.summaryCardText }}>{summaryData.sundayHours}</p>
            </div>
          </div>
        </div>

        {currentUserId ? (
          <>
            {showRegisterForm && (
              <div
                className="p-4 sm:p-6 rounded-xl border shadow-lg transition-colors duration-200 mt-6"
                style={{
                  borderColor: currentTheme.border,
                  backgroundColor: currentTheme.cardBackground,
                }}
              >
                <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: currentTheme.primary }}>
                  Registrar Nueva Hora Extra
                </h3>

                <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2">Límites legales:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Máximo 2 horas extras por día</strong> (sin importar el tipo)</li>
                    <li>• <strong>Máximo 12 horas extras por semana</strong></li>
                    <li>• <strong>Horas nocturnas:</strong> 9:00 pm - 6:00 am (recargo nocturno)</li>
                    <li>• <strong>Horas festivas:</strong> Todo el día en días festivos (recargo festivo)</li>
                    <li>• <strong>Horas dominicales:</strong> Todo el día en domingos (recargo dominical)</li>
                  </ul>
                </div>

                {Object.keys(validationErrors).length > 0 && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
                    <div className="flex items-start text-red-700">
                      <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <h4 className="font-bold mb-1">Errores de validación:</h4>
                        <ul className="space-y-1">
                          {Object.entries(validationErrors).map(([key, message]) => (
                            <li key={key} className="text-sm">• {message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.subtleText }}>
                      Fecha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={newHour.date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md shadow-sm p-2 text-sm sm:text-base transition-colors duration-200"
                      style={{
                        backgroundColor: currentTheme.inputBackground,
                        borderColor: validationErrors.date ? '#EF4444' : currentTheme.inputBorder,
                        color: currentTheme.text,
                        border: "1px solid",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.subtleText }}>
                      Hora de inicio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={newHour.startTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md shadow-sm p-2 text-sm sm:text-base transition-colors duration-200"
                      style={{
                        backgroundColor: currentTheme.inputBackground,
                        borderColor: validationErrors.startTime ? '#EF4444' : currentTheme.inputBorder,
                        color: currentTheme.text,
                        border: "1px solid",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.subtleText }}>
                      Hora de fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={newHour.endTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md shadow-sm p-2 text-sm sm:text-base transition-colors duration-200"
                      style={{
                        backgroundColor: currentTheme.inputBackground,
                        borderColor: validationErrors.endTime ? '#EF4444' : currentTheme.inputBorder,
                        color: currentTheme.text,
                        border: "1px solid",
                      }}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.subtleText }}>
                      Motivo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="reason"
                      value={newHour.reason}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md shadow-sm p-2 text-sm sm:text-base transition-colors duration-200"
                      style={{
                        backgroundColor: currentTheme.inputBackground,
                        borderColor: validationErrors.reason ? '#EF4444' : currentTheme.inputBorder,
                        color: currentTheme.text,
                        border: "1px solid",
                      }}
                      placeholder="Describe brevemente el motivo de las horas extras"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowRegisterForm(false);
                      setValidationErrors({});
                    }}
                    className="py-2.5 px-4 rounded-md font-semibold shadow-md transition-all duration-300"
                    style={{
                      backgroundColor: currentTheme.buttonSecondaryBg,
                      color: currentTheme.buttonSecondaryText,
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addExtraHour}
                    className="py-2.5 px-4 rounded-md font-semibold shadow-md transition-all duration-300"
                    style={{
                      backgroundColor: currentTheme.buttonPrimaryBg,
                      color: currentTheme.buttonPrimaryText,
                    }}
                  >
                    Registrar Hora Extra
                  </button>
                </div>
              </div>
            )}

            <h3
              className="text-xl sm:text-2xl font-bold mb-4 mt-8"
              style={{ color: currentTheme.primary }}
            >
              Tus Horas Registradas
            </h3>

            {extraHours.length === 0 ? (
              <p
                className="text-center py-8 text-lg"
                style={{ color: currentTheme.subtleText }}
              >
                No hay registros de horas extras para tu usuario.
              </p>
            ) : (
              <div
                className="overflow-x-auto rounded-lg shadow-lg border transition-colors duration-200"
                style={{ borderColor: currentTheme.border }}
              >
                <table
                  className="min-w-full divide-y"
                  style={{
                    borderColor: currentTheme.border,
                    backgroundColor: currentTheme.cardBackground,
                  }}
                >
                  <thead
                    style={{
                      backgroundColor: isLightTheme ? "#F9FAFB" : "#374151",
                    }}
                  >
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Fecha
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Inicio
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Fin
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Duración
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Tipo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Razón
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: currentTheme.subtleText }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y"
                    style={{
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                    }}
                  >
                    {extraHours.map((hour) => (
                      <tr
                        key={hour.id}
                        className="hover:bg-opacity-50 transition-colors duration-200"
                        style={{ backgroundColor: currentTheme.cardBackground }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hour.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(hour.date).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hour.startTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hour.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {calculateDuration(hour.startTime, hour.endTime).toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hour.hourType === 'nocturna' ? 'bg-purple-100 text-purple-800' :
                            hour.hourType === 'festiva' ? 'bg-red-100 text-red-800' :
                              hour.hourType === 'dominical' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {hour.hourType === 'nocturna' ? 'Nocturna' :
                              hour.hourType === 'festiva' ? 'Festiva' :
                                hour.hourType === 'dominical' ? 'Dominical' :
                                  'Normal'}
                          </span>
                        </td>

                        {editId === hour.id ? (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="text"
                              name="reason"
                              value={editData.reason}
                              onChange={handleChange}
                              className="w-full rounded-md shadow-sm p-1 text-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              style={{
                                backgroundColor: currentTheme.inputBackground,
                                borderColor: currentTheme.inputBorder,
                                color: currentTheme.text,
                                border: "1px solid",
                              }}
                            />
                          </td>
                        ) : (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {hour.reason}
                          </td>
                        )}

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex text-xs leading-5 font-semibold rounded-full items-center space-x-1 ${hour.status === "Aprobado"
                              ? "text-green-600 dark:text-green-400"
                              : hour.status === "Rechazado"
                                ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 px-2"
                                : "text-yellow-600 dark:text-yellow-400"
                              }`}
                          >
                            {getStatusIcon(hour.status)}
                            <span>{hour.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                          {editId === hour.id ? (
                            <>
                              <button
                                onClick={() => handleEditSave(hour.id)}
                                className="p-2 rounded-md font-semibold text-xs flex items-center justify-center transition-all duration-300 hover:scale-110"
                                style={{
                                  backgroundColor: currentTheme.buttonPrimaryBg,
                                  color: currentTheme.buttonPrimaryText,
                                }}
                              >
                                Guardar
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="p-2 rounded-md font-semibold text-xs flex items-center justify-center transition-all duration-300 hover:scale-110"
                                style={{
                                  backgroundColor:
                                    currentTheme.buttonSecondaryBg,
                                  color: currentTheme.buttonSecondaryText,
                                }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              {hour.status === "Pendiente" && (
                                <>
                                  <button
                                    onClick={() => handleEditInit(hour)}
                                    className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-100 transition-colors"
                                    title="Editar"
                                  >
                                    <Edit size={20} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(hour.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </>
                              )}
                              {hour.status !== "Pendiente" && (
                                <button
                                  onClick={() => handleDeleteClick(hour.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={20} />
                                </button>
                              )}
                              {hour.rejectionReason?.trim() && (
                                <button
                                  onClick={() => setSelectedNote(hour)}
                                  className="text-yellow-500 hover:text-yellow-700 p-1 rounded hover:bg-yellow-100 transition-colors"
                                  title="Ver nota del administrador"
                                >
                                  <StickyNote size={20} />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p
            style={{ color: currentTheme.subtleText }}
            className="text-center py-12 text-xl"
          >
            Por favor, inicia sesión para ver y gestionar tus horas extras.
          </p>
        )}

        {/* Modal de límite legal */}
        {showLegalLimitModal && (
  <div className="fixed left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        Límite de Horas Extra Excedido
      </h2>
      <p className="text-gray-800 mb-4">
        Has alcanzado el límite máximo de <strong>2 horas extras por día</strong>.
        No puedes registrar más horas extras para esta fecha.
      </p>
      <div className="flex justify-end">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowLegalLimitModal(false)}
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
)}


        {/* Modal de fecha futura */}
        {showFutureDateModal && (
  <div className="fixed left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        Fecha Inválida
      </h2>
      <p className="text-gray-800 mb-4">
        No puedes registrar horas extras para una <strong>fecha futura</strong>. Solo puedes registrar horas del día actual o anteriores.
      </p>
      <div className="flex justify-end">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowFutureDateModal(false)}
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
)}


        {/* Modal de superposición de horas */}
      {showOverlapModal && (
  <div
    className="fixed  left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center"
    style={{ position: "fixed" }}
  >
    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        Conflicto de Horario
      </h2>
      <p className="text-gray-800 mb-4">
        Ya tienes una hora extra registrada que se superpone con este horario. Por favor, ajusta el rango de tiempo.
      </p>
      <div className="flex justify-end">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowOverlapModal(false)}
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
)}



        {/* Modal de nota del administrador */}
       {selectedNote && (
  <div className="fixed left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        Nota del Administrador
      </h2>
      <div className="mb-4">
        <p className="text-gray-900">
          <strong>Usuario:</strong> {selectedNote.userId}
        </p>
     <p className="text-gray-900">
  <strong>Correo:</strong>{" "}
  {userNames[selectedNote?.approvedRejectedByUserId]?.email || "admin@ejemplo.com"}
</p>


        <p className="text-gray-900">
          <strong>Fecha de solicitud:</strong>{" "}
         {new Date(
  selectedNote.approvedRejectedAt || selectedNote.requestedAt
).toLocaleDateString("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})}

        </p>
        <p className="text-gray-900">
          <strong>Fecha de {selectedNote.status.toLowerCase()}:</strong>{" "}
          {new Date(
  selectedNote.approvedRejectedAt || selectedNote.requestedAt
).toLocaleDateString("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})}

        </p>
        <p className="text-gray-900">
          <strong>Estado Actual:</strong>{" "}
          <span
            className={`px-2 py-1 rounded-full text-xs ml-2 ${
              selectedNote.status === "Aprobado"
                ? "bg-green-100 text-green-800"
                : selectedNote.status === "Rechazado"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {selectedNote.status}
          </span>
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Nota del administrador:
        </label>
        <p className="border border-gray-200 bg-gray-50 p-2 rounded min-h-[80px] text-gray-900">
          {selectedNote.rejectionReason || "No hay notas para esta solicitud."}
        </p>
      </div>
      <div className="flex justify-end">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          onClick={() => setSelectedNote(null)}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}


        

       {showDeleteModal && (
  <div className="fixed left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div
      className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/3"
      style={{
        backgroundColor: currentTheme.cardBackground,
        color: currentTheme.text,
      }}
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <AlertTriangle className="text-yellow-500 mr-2" size={24} />
        Confirmar eliminación
      </h2>
      <p className="mb-6">
        ¿Estás seguro de que deseas eliminar esta hora extra? Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleDeleteCancel}
          className="px-4 py-2 rounded-md font-medium transition-colors"
          style={{
            backgroundColor: currentTheme.buttonSecondaryBg,
            color: currentTheme.buttonSecondaryText,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleDeleteConfirm}
          className="px-4 py-2 rounded-md font-medium transition-colors"
          style={{
            backgroundColor: currentTheme.buttonDangerBg,
            color: currentTheme.buttonDangerText,
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
)}
        
      </div>
    </div>
  );
};

export default UserPage;