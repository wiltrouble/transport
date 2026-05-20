import { Bus, Car, ClipboardCheck, Percent, Route, Users, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dashboardStatsService } from "@/services/dashboardStatsService";

export async function DashboardStats() {
  const stats = await dashboardStatsService.getSummary();

  const items = [
    { label: "Conductores", value: stats.totalDrivers, icon: Users },
    { label: "Vehículos", value: stats.totalVehicles, icon: Car },
    { label: "Vehículos activos", value: stats.activeVehicles, icon: Bus },
    { label: "Estudiantes asignados", value: stats.assignedStudents, icon: Users },
    { label: "Ocupación global", value: `${stats.occupancyPercent}%`, icon: Percent },
    { label: "Sesiones activas", value: stats.activeSessions, icon: Route },
    { label: "Completadas hoy", value: stats.completedSessionsToday, icon: ClipboardCheck },
    { label: "Abordados hoy", value: stats.boardedStudentsToday, icon: ClipboardCheck },
    { label: "Ausentes hoy", value: stats.absentStudentsToday, icon: UserX },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="flex items-center gap-4">
          <Icon className="size-8 shrink-0 text-indigo-600" aria-hidden />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
