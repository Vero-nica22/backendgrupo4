import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  Users as UsersIcon,
  UserCog,
  ClipboardList,
  Building2,
  Menu,
  Mail,
  Briefcase,
  User,
} from "lucide-react";
import Overview from "./Overview";
import Users from "./Users";
import Departments from "./Departments";
import Requests from "./Requests";
import authService from "../services/authService";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState({
    name: "Cargando...",
    email: "",
    role: "",
    department: "",
    position: "",
    profilePictureUrl: null,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate("/admin-dasboard ");
        return;
      }

      try {
        const res = await fetch(`http://localhost:5023/api/users/${currentUser.userId}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });

        if (!res.ok) throw new Error("No se pudo obtener el perfil");

        const data = await res.json();
        setUser({
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          email: data.email || "",
          role: data.role || "",
          department: data.departmentName || "",
          position: data.position || "",
          profilePictureUrl: data.profilePictureUrl || null,
        });
      } catch (error) {
        console.error("Error al cargar el perfil del administrador:", error);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const tabs = [
    { id: "overview", label: "Resumen", icon: <UserCog className="h-4 w-4" /> },
    { id: "users", label: "Usuarios", icon: <UsersIcon className="h-4 w-4" /> },
    { id: "departments", label: "Departamentos", icon: <Building2 className="h-4 w-4" /> },
    { id: "requests", label: "Solicitudes", icon: <ClipboardList className="h-4 w-4" /> },
  ];

  return (
    <div className="container mx-auto p-2 sm:p-4 bg-gray-50 min-h-screen">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-6 w-full sm:w-auto">
          {/* ✅ Avatar con imagen de perfil */}
          <div className="relative mb-4 sm:mb-0">
            <a href="/admin-profile" className="block">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg bg-gray-200">
                {user.profilePictureUrl ? (
                  <img
                    src={`http://localhost:5023${user.profilePictureUrl}`}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full p-3 text-white bg-blue-500" />
                )}
              </div>
            </a>
            <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{user.name}</h1>
            <div className="mt-1 mb-2 bg-blue-100 px-3 py-1.5 rounded-full text-sm font-medium text-blue-700 inline-block">
              {user.position}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-gray-600">
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">{user.department}</span>
              </div>
            </div>

            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => {
                if (user.role === "Admin") {
                  navigate("/admin-profile");
                } else {
                  navigate("/user-profile");
                }
              }}
            >
              Ver perfil
            </button>
          </div>
        </div>
      </div>

      <div className="block md:hidden mb-4">
        <button
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="h-5 w-5 mr-2" />
          <span>{tabs.find((tab) => tab.id === activeTab)?.label || "Menú"}</span>
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {menuOpen && (
          <div className="block md:hidden absolute z-10 bg-white shadow-lg rounded-md w-[calc(100%-2rem)] mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center w-full text-left px-4 py-3 border-b border-gray-100 ${
                  activeTab === tab.id ? "bg-blue-50 text-blue-600" : ""
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMenuOpen(false);
                }}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        <TabsList className="hidden md:grid grid-cols-7 mb-8">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden lg:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="users"><Users /></TabsContent>
        <TabsContent value="departments"><Departments /></TabsContent>
        <TabsContent value="requests"><Requests /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
