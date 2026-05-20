import { driverService } from "@/services/driverService";
import { sessionStudentService } from "@/services/sessionStudentService";
import { transportSessionService } from "@/services/transportSessionService";
import { vehicleService } from "@/services/vehicleService";
import { vehicleStudentService } from "@/services/vehicleStudentService";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapVehicle } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import { Query } from "appwrite";

export type DashboardStats = {
  totalDrivers: number;
  totalVehicles: number;
  activeVehicles: number;
  assignedStudents: number;
  occupancyPercent: number;
  activeSessions: number;
  completedSessionsToday: number;
  boardedStudentsToday: number;
  absentStudentsToday: number;
};

export const dashboardStatsService = {
  async getSummary(): Promise<DashboardStats> {
    const [
      totalDrivers,
      totalVehicles,
      activeVehicles,
      assignedStudents,
      activeSessions,
      completedSessionsToday,
      boardedStudentsToday,
      absentStudentsToday,
    ] = await Promise.all([
      driverService.count(),
      vehicleService.count(),
      vehicleService.count(true),
      vehicleStudentService.countAssignedStudents(),
      transportSessionService.countByStatus("active"),
      transportSessionService.countCompletedToday(),
      sessionStudentService.countBoardedToday(),
      sessionStudentService.countAbsentToday(),
    ]);

    const tablesDB = await getServerTablesDB();
    const { databaseId, vehiclesTableId } = getTablesConfig();
    const vehiclesResult = await tablesDB.listRows({
      databaseId,
      tableId: vehiclesTableId,
      queries: [Query.equal("status", true), Query.limit(500)],
    });
    const vehicles = (vehiclesResult.rows as AppwriteRow[]).map(mapVehicle);
    const counts = await vehicleStudentService.countByVehicleIds(
      vehicles.map((v) => v.id),
    );

    let totalCapacity = 0;
    let totalAssigned = 0;
    for (const vehicle of vehicles) {
      totalCapacity += vehicle.capacity;
      totalAssigned += counts.get(vehicle.id) ?? 0;
    }

    const occupancyPercent =
      totalCapacity > 0 ? Math.min(100, Math.round((totalAssigned / totalCapacity) * 100)) : 0;

    return {
      totalDrivers,
      totalVehicles,
      activeVehicles,
      assignedStudents,
      occupancyPercent,
      activeSessions,
      completedSessionsToday,
      boardedStudentsToday,
      absentStudentsToday,
    };
  },
};
