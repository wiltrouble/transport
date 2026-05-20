import { Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapGpsTracking } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import { GPS_SESSION_COL } from "@/lib/gps-relations";
import { getTablesConfig } from "@/lib/tables-config";
import { resolveVehicleTrackingStatus } from "@school/utils";
import type { GpsTrackingPoint, LiveVehicleTracking } from "@school/types";
import { transportSessionService } from "@/services/transportSessionService";
import { sessionStudentService } from "@/services/sessionStudentService";

const GPS_FETCH_LIMIT = 500;

async function listGpsRows(queries: string[]): Promise<AppwriteRow[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, gpsTrackingTableId } = getTablesConfig();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: gpsTrackingTableId,
    queries,
  });
  return result.rows as AppwriteRow[];
}

function findLatestForSession(rows: AppwriteRow[], sessionId: string): GpsTrackingPoint | null {
  const points = rows
    .map(mapGpsTracking)
    .filter((p) => p.transportSessionId === sessionId)
    .sort((a, b) => new Date(b.trackedAt).getTime() - new Date(a.trackedAt).getTime());
  return points[0] ?? null;
}

export async function getLatestPointForSession(
  sessionId: string,
): Promise<GpsTrackingPoint | null> {
  try {
    const rows = await listGpsRows([
      Query.equal(GPS_SESSION_COL, sessionId),
      Query.orderDesc("trackedAt"),
      Query.limit(1),
    ]);
    if (rows.length > 0) {
      return mapGpsTracking(rows[0]);
    }
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
  }

  try {
    const rows = await listGpsRows([
      Query.orderDesc("trackedAt"),
      Query.limit(GPS_FETCH_LIMIT),
    ]);
    const found = findLatestForSession(rows, sessionId);
    if (found) return found;
  } catch {
    // fall through
  }

  const all = await listGpsRows([Query.limit(GPS_FETCH_LIMIT)]);
  return findLatestForSession(all, sessionId);
}

export async function getActiveTrackingSessions(): Promise<LiveVehicleTracking[]> {
  const activeSessions = await transportSessionService.getActiveSessions();
  const now = Date.now();

  return Promise.all(
    activeSessions.map(async (session) => {
      const [latestPoint, students] = await Promise.all([
        getLatestPointForSession(session.id),
        sessionStudentService.getSessionStudents(session.id),
      ]);

      return {
        transportSessionId: session.id,
        vehicleId: session.vehicleId,
        driverId: session.driverId,
        vehiclePlate: session.vehicle?.plate ?? "—",
        driverName: session.driver?.fullName ?? "—",
        sessionStatus: session.status,
        studentCount: students.length,
        latestPoint,
        status: resolveVehicleTrackingStatus(session.status, latestPoint, now),
      } satisfies LiveVehicleTracking;
    }),
  );
}

export async function getLiveTrackingSnapshot(): Promise<LiveVehicleTracking[]> {
  return getActiveTrackingSessions();
}

/** Alias for live map dashboard. */
export async function getLatestVehicleLocations(): Promise<LiveVehicleTracking[]> {
  return getLiveTrackingSnapshot();
}
