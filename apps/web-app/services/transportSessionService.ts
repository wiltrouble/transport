import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapDriver, mapVehicle } from "@/lib/mappers";
import {
  canTransitionSession,
  type TransportSessionStatus,
} from "@school/utils";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  readDriverIdFromSessionRow,
  readVehicleIdFromSessionRow,
  TRANSPORT_SESSION_DRIVER_COL,
  TRANSPORT_SESSION_VEHICLE_COL,
} from "@/lib/session-relations";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { ListParams, PaginatedResult } from "@school/types";
import type {
  TransportSession,
  TransportSessionInput,
  TransportSessionListItem,
  TransportSessionWithDetails,
} from "@school/types";
import { sessionStudentService } from "@/services/sessionStudentService";
import { driverService } from "@/services/driverService";
import { vehicleService } from "@/services/vehicleService";

const DEFAULT_PAGE_SIZE = 10;
const FETCH_LIMIT = 500;

function sessionDateToRow(value: string): string {
  return value.slice(0, 10);
}

function mapSession(row: AppwriteRow): TransportSession {
  const vehicleRef = row[TRANSPORT_SESSION_VEHICLE_COL];
  const driverRef = row[TRANSPORT_SESSION_DRIVER_COL];

  return {
    id: row.$id,
    vehicleId: readVehicleIdFromSessionRow(row),
    driverId: readDriverIdFromSessionRow(row),
    sessionDate: String(row.sessionDate ?? "").slice(0, 10),
    shift: String(row.shift ?? ""),
    startTime: row.startTime ? String(row.startTime) : null,
    endTime: row.endTime ? String(row.endTime) : null,
    startedBy: String(row.startedBy ?? ""),
    completedBy: String(row.completedBy ?? ""),
    status: String(row.status ?? "pending") as TransportSessionStatus,
    notes: String(row.notes ?? ""),
    vehicle:
      vehicleRef && typeof vehicleRef === "object"
        ? mapVehicle(vehicleRef as AppwriteRow)
        : null,
    driver:
      driverRef && typeof driverRef === "object"
        ? mapDriver(driverRef as AppwriteRow)
        : null,
  };
}

async function listSessionRows(queries: string[]): Promise<AppwriteRow[]> {
  const tablesDB = await getServerTablesDB();
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
  if (!vehicle && session.vehicleId) {
    vehicle = await vehicleService.getById(session.vehicleId);
  }
  if (!driver && session.driverId) {
    driver = await driverService.getById(session.driverId);
  }
  return { ...session, vehicle, driver };
}

function buildListQueries(params: ListParams): string[] {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const queries: string[] = [
    Query.limit(pageSize),
    Query.offset((page - 1) * pageSize),
  ];
  return queries;
}

export const transportSessionService = {
  async list(
    params: ListParams & { sessionStatus?: TransportSessionStatus } = {},
  ): Promise<PaginatedResult<TransportSessionListItem>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

    let rows: AppwriteRow[];
    try {
      const queries = buildListQueries({ ...params, page: 1, pageSize: FETCH_LIMIT });
      if (params.sessionStatus) {
        queries.push(Query.equal("status", params.sessionStatus));
      }
      rows = await listSessionRows(queries);
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
      rows = await listSessionRows([Query.limit(FETCH_LIMIT)]);
    }

    let sessions = await Promise.all(rows.map((r) => enrichSession(mapSession(r))));

    if (params.sessionStatus) {
      sessions = sessions.filter((s) => s.status === params.sessionStatus);
    }

    const search = params.search?.trim().toLowerCase();
    if (search) {
      sessions = sessions.filter((s) => {
        const plate = s.vehicle?.plate?.toLowerCase() ?? "";
        const driver = s.driver?.fullName?.toLowerCase() ?? "";
        const date = s.sessionDate.toLowerCase();
        return plate.includes(search) || driver.includes(search) || date.includes(search);
      });
    }

    sessions.sort(
      (a, b) =>
        new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime() ||
        (b.startTime ?? "").localeCompare(a.startTime ?? ""),
    );

    const counts = await Promise.all(
      sessions.map(async (s) => ({
        id: s.id,
        count: (await sessionStudentService.getSessionStudents(s.id)).length,
      })),
    );
    const countMap = new Map(counts.map((c) => [c.id, c.count]));

    const enriched: TransportSessionListItem[] = sessions.map((s) => ({
      ...s,
      studentCount: countMap.get(s.id) ?? 0,
    }));

    const total = enriched.length;
    const start = (page - 1) * pageSize;
    const items = enriched.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getById(id: string): Promise<TransportSession | null> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();
    try {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: transportSessionsTableId,
        rowId: id,
      });
      return enrichSession(mapSession(row as AppwriteRow));
    } catch {
      return null;
    }
  },

  async getByIdWithDetails(id: string): Promise<TransportSessionWithDetails | null> {
    const session = await this.getById(id);
    if (!session) return null;
    const students = await sessionStudentService.getSessionStudents(id);
    return {
      ...session,
      students,
      summary: sessionStudentService.buildSummary(students),
    };
  },

  async getActiveSessions(): Promise<TransportSession[]> {
    let rows: AppwriteRow[];
    try {
      rows = await listSessionRows([
        Query.equal("status", "active"),
        Query.limit(100),
      ]);
    } catch {
      const all = await listSessionRows([Query.limit(FETCH_LIMIT)]);
      rows = all.filter((r) => String(r.status) === "active");
    }
    return Promise.all(rows.map((r) => enrichSession(mapSession(r))));
  },

  async hasActiveSessionForVehicle(vehicleId: string): Promise<boolean> {
    const active = await this.getActiveSessions();
    return active.some((s) => s.vehicleId === vehicleId);
  },

  async getActiveSessionForDriver(driverId: string): Promise<TransportSession | null> {
    const active = await this.getActiveSessions();
    return active.find((s) => s.driverId === driverId) ?? null;
  },

  async getActiveSessionForVehicle(vehicleId: string): Promise<TransportSession | null> {
    const active = await this.getActiveSessions();
    return active.find((s) => s.vehicleId === vehicleId) ?? null;
  },

  async createSession(
    input: TransportSessionInput,
    startedBy = "",
  ): Promise<TransportSessionWithDetails> {
    const [vehicle, driver] = await Promise.all([
      vehicleService.getById(input.vehicleId),
      driverService.getById(input.driverId),
    ]);

    if (!vehicle) throw new Error("Vehículo no encontrado.");
    if (!vehicle.status) throw new Error("El vehículo debe estar activo.");
    if (!driver) throw new Error("Conductor no encontrado.");
    if (!driver.status) throw new Error("El conductor debe estar activo.");

    if (await this.hasActiveSessionForVehicle(input.vehicleId)) {
      throw new Error("Este vehículo ya tiene una sesión activa.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: transportSessionsTableId,
      rowId: ID.unique(),
      data: {
        [TRANSPORT_SESSION_VEHICLE_COL]: input.vehicleId,
        [TRANSPORT_SESSION_DRIVER_COL]: input.driverId,
        sessionDate: sessionDateToRow(input.sessionDate),
        shift: input.shift,
        startTime: null,
        endTime: null,
        startedBy,
        completedBy: "",
        status: "pending",
        notes: input.notes?.trim() ?? "",
      },
    });

    const session = await enrichSession(mapSession(row as AppwriteRow));
    const students = await sessionStudentService.loadVehicleStudents(
      session.id,
      input.vehicleId,
    );

    return {
      ...session,
      students,
      summary: sessionStudentService.buildSummary(students),
    };
  },

  async startSession(id: string, startedBy = ""): Promise<TransportSession> {
    const session = await this.getById(id);
    if (!session) throw new Error("Sesión no encontrada.");
    if (!canTransitionSession(session.status, "active")) {
      throw new Error("No se puede iniciar esta sesión en su estado actual.");
    }
    if (await this.hasActiveSessionForVehicle(session.vehicleId)) {
      const other = await this.getActiveSessionForVehicle(session.vehicleId);
      if (other && other.id !== id) {
        throw new Error("Otro viaje activo ya existe para este vehículo.");
      }
    }

    const tablesDB = await getServerTablesDB();
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

    return enrichSession(mapSession(row as AppwriteRow));
  },

  async completeSession(id: string, completedBy = ""): Promise<TransportSession> {
    const session = await this.getById(id);
    if (!session) throw new Error("Sesión no encontrada.");
    if (!canTransitionSession(session.status, "completed")) {
      throw new Error("Solo sesiones activas pueden completarse.");
    }

    const tablesDB = await getServerTablesDB();
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

    return enrichSession(mapSession(row as AppwriteRow));
  },

  async cancelSession(id: string): Promise<TransportSession> {
    const session = await this.getById(id);
    if (!session) throw new Error("Sesión no encontrada.");
    if (!canTransitionSession(session.status, "cancelled")) {
      throw new Error("No se puede cancelar esta sesión.");
    }

    const tablesDB = await getServerTablesDB();
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

    return enrichSession(mapSession(row as AppwriteRow));
  },

  async countByStatus(status: TransportSessionStatus): Promise<number> {
    try {
      const rows = await listSessionRows([
        Query.equal("status", status),
        Query.limit(1),
      ]);
      const tablesDB = await getServerTablesDB();
      const { databaseId, transportSessionsTableId } = getTablesConfig();
      const result = await tablesDB.listRows({
        databaseId,
        tableId: transportSessionsTableId,
        queries: [Query.equal("status", status), Query.limit(1)],
        total: true,
      });
      return result.total ?? rows.length;
    } catch {
      const all = await listSessionRows([Query.limit(FETCH_LIMIT)]);
      return all.filter((r) => String(r.status) === status).length;
    }
  },

  async countCompletedToday(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const all = await listSessionRows([Query.limit(FETCH_LIMIT)]);
    return all.filter(
      (r) =>
        String(r.status) === "completed" &&
        String(r.sessionDate ?? "").slice(0, 10) === today,
    ).length;
  },

};
