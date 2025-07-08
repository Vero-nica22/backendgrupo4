import React, { useState, useEffect, useRef } from "react";
import { User, Settings, Briefcase, Mail, Sun, Moon, ChevronLeft, Camera } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const AdminProfile = () => {
  const { isLightTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

 const [user, setUser] = useState({
  firstName: "Cargando",
  lastName: "",
  email: "",
  role: "",
  department: "Cargando departamento...",
  departmentId: null,
  position: "",
  isActive: true,
  profilePictureUrl: null, // ✅ importante
});


  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const userIdToFetch = currentUser.userId;
    if (!userIdToFetch) {
      console.error("No se pudo obtener el userId del usuario actual.");
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userRes = await fetch(
          `http://localhost:5023/api/users/${userIdToFetch}`,
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
            },
          }
        );
        
        if (!userRes.ok) throw new Error("No se pudo obtener el perfil");
        
        const userData = await userRes.json();
        
        let departmentName = "Sin departamento";
        if (userData.departmentId) {
          try {
            const deptRes = await fetch(
              `http://localhost:5023/api/departments/${userData.departmentId}`,
              {
                headers: {
                  Authorization: `Bearer ${currentUser.token}`,
                },
              }
            );
            
            if (deptRes.ok) {
              const deptData = await deptRes.json();
              departmentName = deptData.name;
            }
          } catch (err) {
            console.error("Error al obtener el departamento:", err);
          }
        }

        if (userData.profilePictureUrl) {
  setPreviewUrl(`http://localhost:5023${userData.profilePictureUrl}`);
}

        setUser({
          ...userData,
          department: departmentName,
        });
      } catch (err) {
        console.error("Error al cargar el perfil:", err);
        navigate("/login");
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Mostrar vista previa inmediata desde el dispositivo local
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result); // Esto muestra la imagen seleccionada al instante
    };
    reader.readAsDataURL(file);

    // Subir la foto al servidor en segundo plano
    setIsUploading(true);
    const formData = new FormData();
formData.append("file", file);

    try {
      const currentUser = authService.getCurrentUser();
     const response = await fetch(
  `http://localhost:5023/api/users/${currentUser.userId}/upload-profile-picture`, // ✅ endpoint correcto
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
    },
    body: formData,
  }
);

const result = await response.json();
      
     // ✅ Actualiza el estado y la vista previa con la URL del servidor
setUser(prev => ({
  ...prev,
  profilePictureUrl: result.imageUrl,
}));
setPreviewUrl(`http://localhost:5023${result.imageUrl}`);
      
      // Mantenemos la vista previa local (más rápida) pero actualizamos con la URL del servidor
      // setPreviewUrl(`http://localhost:5023/${result.profilePicture}`);
    } catch (error) {
      console.error('Error al subir la foto:', error);
      // Si hay error, mantenemos la vista previa local hasta que se resuelva
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const colors = {
    light: {
      primary: "#3B82F6",
      accent: "#10B981",
      background: "#FFFFFF",
      cardBackground: "#FFFFFF",
      text: "#1F2937",
      subtleText: "#6B7280",
      border: "#E5E7EB",
      iconBackground: "#EFF6FF",
    },
    dark: {
      primary: "#60A5FA",
      accent: "#34D399",
      background: "#111827",
      cardBackground: "#1F2937",
      text: "#F9FAFB",
      subtleText: "#9CA3AF",
      border: "#374151",
      iconBackground: "#1E40AF",
    },
  };

  const currentTheme = isLightTheme ? colors.light : colors.dark;

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.text,
      }}
    >
      <div className="flex-grow flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: currentTheme.cardBackground }}
        >
          <div
            className="relative py-12 px-8 flex flex-col items-center"
            style={{ backgroundColor: currentTheme.primary, color: "white" }}
          >
            {/* Botón de retroceso y tema */}
            <a
              href="/admin-dashboard"
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
              aria-label="Volver a AdminDashboard"
            >
              <ChevronLeft size={24} />
            </a>

            <button
              onClick={toggleTheme}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {isLightTheme ? <Moon size={24} /> : <Sun size={24} />}
            </button>

            {/* Área de la foto de perfil */}
            <div className="relative group">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center shadow-lg mb-4 overflow-hidden relative"
                style={{ backgroundColor: currentTheme.iconBackground }}
              >
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} color={currentTheme.primary} strokeWidth={1.5} />
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              {/* Botón para cambiar foto */}
              <button
                onClick={triggerFileInput}
                disabled={isUploading}
                className={`absolute bottom-0 right-0 p-2 rounded-full shadow-md transition-all ${
                  isUploading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-white hover:bg-gray-100 cursor-pointer"
                }`}
                style={{ color: currentTheme.primary }}
                title="Cambiar foto de perfil"
              >
                <Camera size={20} />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Información del usuario */}
            <h1 className="text-3xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-lg opacity-80">{user.role}</p>
            <div className="flex items-center mt-2 space-x-2">
              <Mail className="w-5 h-5" />
              <span className="text-sm">{user.email}</span>
            </div>
          </div>

          {/* Secciones de detalles profesionales y configuración */}
          <div className="p-8">
            <div
              className="w-full rounded-2xl p-6 space-y-4 border mb-6"
              style={{ borderColor: currentTheme.border }}
            >
              <h2
                className="text-xl font-semibold flex items-center mb-4"
                style={{ color: currentTheme.primary }}
              >
                <Briefcase className="mr-3" /> Detalles profesionales
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Briefcase className="mr-3" color={currentTheme.primary} />
                  <span>Departamento: {user.department}</span>
                </div>
                <div>
                  <span>Posición: {user.position}</span>
                </div>
                <div>
                  <span>
                    Estado:
                    <span
                      className="ml-2 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: user.isActive
                          ? currentTheme.accent
                          : "#EF4444",
                        color: "white",
                      }}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div
              className="w-full rounded-2xl p-6 space-y-4 border"
              style={{ borderColor: currentTheme.border }}
            >
              <h2
                className="text-xl font-semibold flex items-center mb-4"
                style={{ color: currentTheme.primary }}
              >
                <Settings className="mr-3" /> Configuración de la cuenta
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Tema preferido</span>
                  <div
                    className="w-16 h-8 rounded-full flex items-center cursor-pointer"
                    style={{
                      backgroundColor: isLightTheme ? "#E0E0E0" : "#444444",
                      justifyContent: isLightTheme ? "flex-start" : "flex-end",
                    }}
                    onClick={toggleTheme}
                  >
                    <span
                      className="w-6 h-6 rounded-full m-1"
                      style={{
                        backgroundColor: isLightTheme ? "white" : "#2196F3",
                      }}
                    ></span>
                  </div>
                </div>
                <div
                  className="text-sm"
                  style={{ color: currentTheme.subtleText }}
                >
                  Tema actual: {isLightTheme ? "Claro" : "Oscuro"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;