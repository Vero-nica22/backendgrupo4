import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getDashboardSummary } from "../services/dashboardService";
import extraHourService from "../services/extraHourService";

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los datos del dashboard
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsersCount: 0,
    pendingExtraHoursCount: 0,
    approvedHoursThisMonth: 0,
    activeDepartments: 0,
    totalDepartments: 0,
    departmentStats: []
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [allExtraHours, setAllExtraHours] = useState([]);

  // Función para calcular duración de horas extras
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

  // Función para calcular horas pendientes
  const calculatePendingHours = (extraHours) => {
    let pendingHours = 0;
    extraHours.forEach((hour) => {
      if (hour.status === "Pendiente") {
        const duration = calculateDuration(hour.startTime, hour.endTime);
        pendingHours += duration;
      }
    });
    return pendingHours;
  };

  // Función para calcular horas aprobadas del mes actual
  const calculateApprovedHoursThisMonth = (extraHours) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let approvedHours = 0;
    extraHours.forEach((hour) => {
      if (hour.status === "Aprobado") {
        const hourDate = new Date(hour.date);
        if (hourDate.getMonth() === currentMonth && hourDate.getFullYear() === currentYear) {
          const duration = calculateDuration(hour.startTime, hour.endTime);
          approvedHours += duration;
        }
      }
    });
    return approvedHours;
  };

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
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obtener el resumen del dashboard
        const summary = await getDashboardSummary();

        // Obtener todas las horas extras - try different method names
        let extraHoursData = [];
        try {
          // Try different possible method names
          if (typeof extraHourService.getAllExtraHours === 'function') {
            const allExtraHoursResponse = await extraHourService.getAllExtraHours();
            extraHoursData = allExtraHoursResponse.data || allExtraHoursResponse || [];
          } else if (typeof extraHourService.getAll === 'function') {
            const allExtraHoursResponse = await extraHourService.getAll();
            extraHoursData = allExtraHoursResponse.data || allExtraHoursResponse || [];
          } else if (typeof extraHourService.getExtraHours === 'function') {
            const allExtraHoursResponse = await extraHourService.getExtraHours();
            extraHoursData = allExtraHoursResponse.data || allExtraHoursResponse || [];
          } else if (typeof extraHourService.fetchAll === 'function') {
            const allExtraHoursResponse = await extraHourService.fetchAll();
            extraHoursData = allExtraHoursResponse.data || allExtraHoursResponse || [];
          } else {
            // Log available methods for debugging
            console.log('Available methods in extraHourService:', Object.getOwnPropertyNames(extraHourService));
            throw new Error('No suitable method found for getting all extra hours');
          }
        } catch (methodError) {
          console.error('Error calling extraHourService method:', methodError);
          // Fallback: try to get data from recent requests and extend from there
          const recentResponse = await extraHourService.getRecentExtraHours();
          extraHoursData = recentResponse.data || [];
        }

        setAllExtraHours(extraHoursData);

        // Calcular las horas pendientes y aprobadas del mes
        const pendingHoursCalculated = calculatePendingHours(extraHoursData);
        const approvedHoursThisMonthCalculated = calculateApprovedHoursThisMonth(extraHoursData);

        // Contar solicitudes pendientes
        const pendingRequestsCount = extraHoursData.filter(hour => hour.status === "Pendiente").length;

        setDashboardData({
          totalUsers: summary.totalUsers,
          activeUsersCount: summary.activeUsers,
          pendingExtraHoursCount: pendingHoursCalculated.toFixed(1), // Mostrar horas pendientes calculadas
          approvedHoursThisMonth: approvedHoursThisMonthCalculated.toFixed(1), // Mostrar horas aprobadas del mes
          activeDepartments: summary.activeDepartments,
          totalDepartments: summary.totalDepartments,
          departmentStats: summary.departmentStats || [],
          pendingRequestsCount: pendingRequestsCount // Mantener el conteo de solicitudes para referencia
        });

        // Obtener las solicitudes recientes de horas extras
        const response = await extraHourService.getRecentExtraHours();
      const enriched = response.data.map((req) => ({
  ...req,
  hourType: determineHourType(req.date, req.startTime, req.endTime).type
}));

const ordenadas = enriched.sort(
  (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
);

setRecentRequests(ordenadas.slice(0, 3));


      } catch (err) {
        console.error("Error al obtener datos del dashboard:", err);
        setError("Error al cargar los datos del dashboard. Intente nuevamente más tarde.");
        
        // Intentar cargar datos desde el summary si hay un error con las solicitudes recientes
        if (err.response && err.response.status === 404) {
          try {
            const summary = await getDashboardSummary();
            if (summary.recentRequests?.length) {
              const ordenFallback = [...summary.recentRequests].sort(
                (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
              );
              setRecentRequests(ordenFallback.slice(0, 3));
            }
          } catch (summaryError) {
            console.error("Error al cargar datos de respaldo:", summaryError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para formatear las horas aprobadas
  const formatHours = (hours) => {
    if (typeof hours === 'number') {
      return hours.toFixed(1);
    }
    return hours || '0.0';
  };

  const cardBg = "bg-white";
  const textColor = "text-gray-900";
  const subtextColor = "text-gray-500";

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">¡Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.197l-2.651 3.652a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-3.652-2.651a1.2 1.2 0 0 1 1.697-1.697L10 8.803l2.651-3.652a1.2 1.2 0 0 1 1.697 1.697L11.697 10l3.652 2.651a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">
          Cargando datos del resumen...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {/* Tarjeta de Total Usuarios */}
            <Card className={cardBg}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${subtextColor}`}>Total Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${textColor}`}>{dashboardData.totalUsers}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <span>{dashboardData.activeUsersCount} activos</span>
                </p>
              </CardContent>
            </Card>

            {/* Tarjeta de Horas Extra Pendientes */}
            <Card className={cardBg}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${subtextColor}`}>Horas Extra Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${textColor}`}>{dashboardData.pendingExtraHoursCount}</div>
                <p className="text-xs text-yellow-500 flex items-center mt-1">
                  <span>{dashboardData.pendingRequestsCount} solicitudes pendientes</span>
                </p>
              </CardContent>
            </Card>

            {/* Tarjeta de Horas Aprobadas (Mes) */}
            <Card className={cardBg}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${subtextColor}`}>Horas Aprobadas (Mes)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${textColor}`}>
                  {formatHours(dashboardData.approvedHoursThisMonth)}
                </div>
                <p className="text-xs text-blue-500 flex items-center mt-1">
                  <span>Horas aprobadas este mes</span>
                </p>
              </CardContent>
            </Card>

            {/* Tarjeta de Departamentos Activos */}
            <Card className={cardBg}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${subtextColor}`}>Departamentos Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${textColor}`}>{dashboardData.activeDepartments}</div>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <span>{dashboardData.totalDepartments} departamentos en total</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tabla de Solicitudes Recientes */}
            <Card className={cardBg}>
              <CardHeader>
                <CardTitle className={textColor}>Solicitudes Recientes</CardTitle>
                <CardDescription className={subtextColor}>
                  Últimas 3 solicitudes de horas extras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className={`text-left py-2 px-1 font-medium ${subtextColor}`}>Usuario</th>
                        <th className={`text-left py-2 px-1 font-medium ${subtextColor}`}>Fecha</th>
                        <th className={`text-left py-2 px-1 font-medium ${subtextColor}`}>Tipo</th>
                        <th className={`text-left py-2 px-1 font-medium ${subtextColor}`}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRequests.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-sm" style={{ color: subtextColor }}>
                            No hay solicitudes recientes.
                          </td>
                        </tr>
                      ) : (
                        recentRequests.map((request) => (
                          <tr key={request.id} className="border-b hover:bg-gray-50">
                            <td className={`py-2 px-1 text-sm ${textColor}`}>
                              {request.user?.fullName || request.userName || "Usuario no disponible"}
                            </td>
                            <td className={`py-2 px-1 text-sm ${textColor}`}>
                              {request.date ? new Date(request.date).toLocaleDateString() : "N/A"}
                            </td>
                          <td className="py-2 px-1 text-sm">
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    request.hourType === 'nocturna' ? 'bg-purple-100 text-purple-800' :
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
                            <td className="py-2 px-1 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                request.status === "Aprobado" ? "bg-green-100 text-green-800" :
                                request.status === "Rechazado" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {request.status || "Pendiente"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Departamentos */}
            <Card className={cardBg}>
              <CardHeader>
                <CardTitle className={textColor}>Departamentos</CardTitle>
                <CardDescription className={subtextColor}>
                  Empleados por departamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className={`text-left py-2 px-1 font-medium ${subtextColor}`}>Departamento</th>
                        <th className={`text-left py-2 px-1 font-medium ${subtextColor}`}>Empleados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.departmentStats.length === 0 ? (
                        <tr>
                          <td colSpan="2" className="text-center py-4 text-sm" style={{ color: subtextColor }}>
                            No hay estadísticas de departamentos.
                          </td>
                        </tr>
                      ) : (
                        dashboardData.departmentStats.map((dept, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className={`py-2 px-1 text-sm ${textColor}`}>{dept.nombre}</td>
                            <td className={`py-2 px-1 text-sm ${textColor}`}>{dept.cantidadEmpleados}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Overview;