import { Query } from "appwrite";
import { getTablesDB } from "@/lib/appwrite";
import { mapTransportSession, mapVehicle } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import {
  readDriverIdFromSessionRow,
  TRANSPORT_SESSION_DRIVER_COL,
} from "@/lib/session-relations";
import { getTablesConfig } from "@/lib/tables-config";
import { canTransitionSession } from "@school/utils";
import type { TransportSession, TransportSessionWithDetails } from "@school/types";
import { driverService } from "@/services/driverService";
import { sessionStudentService } from "@/services/sessionStudentService";

const FETCH_LIMIT = 200;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function listSessionRows(queries: string[]): Promise<AppwriteRow[]> {
  const tablesDB = getTablesDB();
  const { databaseId, transportSessionsTableId } = getTablesConfig();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: transportSessionsTableId,
    queries,
  });
  return result.rows as AppwriteRow[];
}

async function enrichSession(session: TransportSession): Promise<TransportSession> {
  let { vehicle, driver } = session;
  const tablesDB = getTablesDB();
  const { databaseId, vehiclesTableId } = getTablesConfig();

  if (!vehicle && session.vehicleId) {
    try {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: vehiclesTableId,
        rowId: session.vehicleId,
      });
      vehicle = mapVehicle(row as AppwriteRow);
    } catch {
      vehicle = null;
    }
  }
  if (!driver && session.driverId) {
    driver = await driverService.getById(session.driverId);
  }
  return { ...session, vehicle, driver };
}

function buildSummary(students: TransportSessionWithDetails["students"]) {
  return {
    total: students.length,
    boarded: students.filter((s) => s.status === "boarded" || s.boarded).length,
    droppedOff: students.filter((s) => s.status === "dropped_off" || s.droppedOff).length,
    absent: students.filter((s) => s.status === "absent" || s.absent).length,
    pending: students.filter(
      (s) => s.status === "pending" && !s.boarded && !s.droppedOff && !s.absent,
    ).length,
  };
}

export const transportSessionService = {
  async getById(id: string): Promise<TransportSession | null> {
    const tablesDB = getTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();
    try {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: transportSessionsTableId,
        rowId: id,
      });
      return enrichSession(mapTransportSession(row as AppwriteRow));
    } catch {
      return null;
    }
  },

  async getByIdWithDetails(id: string): Promise<TransportSessionWithDetails | null> {
    const session = await this.getById(id);
    if (!session) return null;
    const students = await sessionStudentService.getSessionStudents(id);
    return { ...session, students, summary: buildSummary(students) };
  },

  async getActiveSessionForDriver(driverId: string): Promise<TransportSession | null> {
    let rows: AppwriteRow[];
    try {
      rows = await listSessionRows([
        Query.equal("status", "active"),
        Query.limit(FETCH_LIMIT),
      ]);
    } catch {
      const all = await listSessionRows([Query.limit(FETCH_LIMIT)]);
      rows = all.filter((r) => String(r.status) === "active");
    }

    const matchRow = rows.find((r) => readDriverIdFromSessionRow(r) === driverId);
    if (!matchRow) return null;
    return enrichSession(mapTransportSession(matchRow));
  },

  async getOperationalSessionForDriver(driverId: string): Promise<TransportSession | null> {
    const active = await this.getActiveSessionForDriver(driverId);
    if (active) return active;

    const today = todayIsoDate();
    let rows: AppwriteRow[];
    try {
      rows = await listSessionRows([
        Query.equal(TRANSPORT_SESSION_DRIVER_COL, driverId),
        Query.limit(FETCH_LIMIT),
      ]);
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
      const all = await listSessionRows([Query.limit(FETCH_LIMIT)]);
      rows = all.filter((r) => readDriverIdFromSessionRow(r) === driverId);
    }

    const todaySessions = rows
      .map((r) => mapTransportSession(r))
      .filter((s) => s.sessionDate === today && (s.status === "pending" || s.status === "active"));

    todaySessions.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return 0;
    });

    if (todaySessions.length === 0) return null;
    return enrichSession(todaySessions[0]);
  },

  async startSession(id: string, startedBy = ""): Promise<TransportSession> {
    const session = await this.getById(id);
    if (!session) throw new Error("Sesión no encontrada.");
    if (!canTransitionSession(session.status, "active")) {
      throw new Error("No se puede iniciar esta sesión en su estado actual.");
    }

    const otherActive = await this.getActiveSessionForDriver(session.driverId);
    if (otherActive && otherActive.id !== id) {
      throw new Error("Ya tiene otra sesión activa.");
    }

    const tablesDB = getTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: transportSessionsTableId,
      rowId: id,
      data: {
        status: "active",
        startTime: new Date().toISOString(),
        startedBy: startedBy || session.startedBy,
      },
    });

    return enrichSession(mapTransportSession(row as AppwriteRow));
  },

  async completeSession(id: string, completedBy = ""): Promise<TransportSession> {
    const session = await this.getById(id);
    if (!session) throw new Error("Sesión no encontrada.");
    if (!canTransitionSession(session.status, "completed")) {
      throw new Error("Solo sesiones activas pueden completarse.");
    }

    const tablesDB = getTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: transportSessionsTableId,
      rowId: id,
      data: {
        status: "completed",
        endTime: new Date().toISOString(),
        completedBy,
      },
    });

    return enrichSession(mapTransportSession(row as AppwriteRow));
  },

  async cancelSession(id: string): Promise<TransportSession> {
    const session = await this.getById(id);
    if (!session) throw new Error("Sesión no encontrada.");
    if (!canTransitionSession(session.status, "cancelled")) {
      throw new Error("No se puede cancelar esta sesión.");
    }

    const tablesDB = getTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: transportSessionsTableId,
      rowId: id,
      data: {
        status: "cancelled",
        endTime: new Date().toISOString(),
      },
    });

    return enrichSession(mapTransportSession(row as AppwriteRow));
  },
};
