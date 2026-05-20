import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapDriver, mapVehicle } from "@/lib/mappers";
import {
  canTransitionSession,
  type SessionShift,
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
  OperationalVehicle,
  SessionStudent,
  TransportSession,
  TransportSessionListItem,
  TransportSessionWithDetails,
  VehicleOperationalStatus,
} from "@school/types";
import { sessionStudentService } from "@/services/sessionStudentService";
import { driverService } from "@/services/driverService";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import { vehicleService } from "@/services/vehicleService";

const DEFAULT_PAGE_SIZE = 10;
const FETCH_LIMIT = 500;

function sessionDateToRow(value: string): string {
  return value.slice(0, 10);
}

/**
 * Pick a default shift based on the local hour at the moment the session
 * starts. The operator can always override later via session detail.
 */
function deriveShiftFor(date: Date): SessionShift {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
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

function deriveOperationalStatus(args: {
  vehicleActive: boolean;
  driverPresent: boolean;
  driverActive: boolean;
  studentCount: number;
  hasActiveSession: boolean;
}): { status: VehicleOperationalStatus; reason: string | null } {
  if (args.hasActiveSession) return { status: "active", reason: null };
  if (!args.vehicleActive) {
    return { status: "vehicle_inactive", reason: "Vehículo inactivo" };
  }
  if (!args.driverPresent) {
    return { status: "no_driver", reason: "Sin conductor asignado" };
  }
  if (!args.driverActive) {
    return { status: "driver_inactive", reason: "Conductor inactivo" };
  }
  if (args.studentCount === 0) {
    return { status: "no_students", reason: "Sin estudiantes asignados" };
  }
  return { status: "ready", reason: null };
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

  /**
   * Operational dashboard payload — one card per vehicle with everything the UI
   * needs to render and to decide whether to expose the "Iniciar sesión" CTA.
   *
   * One Appwrite trip to list vehicles + one to list active sessions; driver
   * lookups run in parallel afterwards to keep this O(N) but fast for typical
   * fleet sizes (tens to low hundreds of vehicles).
   */
  async getOperationalVehicles(): Promise<OperationalVehicle[]> {
    const [vehiclesPage, activeSessions] = await Promise.all([
      vehicleService.list({ pageSize: FETCH_LIMIT }),
      this.getActiveSessions(),
    ]);

    const activeByVehicle = new Map<string, TransportSession>();
    for (const session of activeSessions) {
      if (session.vehicleId) activeByVehicle.set(session.vehicleId, session);
    }

    return Promise.all(
      vehiclesPage.items.map(async (vehicle) => {
        const driverAssignment =
          await vehicleDriverService.getCurrentVehicleDriver(vehicle.id);
        const driver = driverAssignment?.driver ?? null;
        const session = activeByVehicle.get(vehicle.id) ?? null;

        const { status, reason } = deriveOperationalStatus({
          vehicleActive: vehicle.status,
          driverPresent: Boolean(driver),
          driverActive: Boolean(driver?.status),
          studentCount: vehicle.assignmentCount,
          hasActiveSession: Boolean(session),
        });

        return {
          vehicle,
          driver,
          assignedStudentCount: vehicle.assignmentCount,
          capacity: vehicle.capacity,
          occupancyPercent: vehicle.occupancyPercent,
          operationalStatus: status,
          activeSession: session,
          blockingReason: reason,
        };
      }),
    );
  },

  /**
   * Operational state for a single vehicle — used by detail pages and by
   * `startVehicleSession()` to enforce business rules in one place.
   */
  async getVehicleOperationalStatus(
    vehicleId: string,
  ): Promise<OperationalVehicle> {
    const vehicle = await vehicleService.getByIdWithDetails(vehicleId);
    if (!vehicle) throw new Error("Vehículo no encontrado.");
    const driver = vehicle.currentDriverAssignment?.driver ?? null;
    const session = await this.getActiveSessionForVehicle(vehicleId);

    const { status, reason } = deriveOperationalStatus({
      vehicleActive: vehicle.status,
      driverPresent: Boolean(driver),
      driverActive: Boolean(driver?.status),
      studentCount: vehicle.assignmentCount,
      hasActiveSession: Boolean(session),
    });

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        capacity: vehicle.capacity,
        color: vehicle.color,
        year: vehicle.year,
        status: vehicle.status,
      },
      driver,
      assignedStudentCount: vehicle.assignmentCount,
      capacity: vehicle.capacity,
      occupancyPercent: vehicle.occupancyPercent,
      operationalStatus: status,
      activeSession: session,
      blockingReason: reason,
    };
  },

  /**
   * Materialize session_students rows from the vehicle's active student
   * assignments. Returns the newly-created session students in pickup order.
   */
  async createSessionStudents(
    transportSessionId: string,
    vehicleId: string,
  ): Promise<SessionStudent[]> {
    return sessionStudentService.loadVehicleStudents(
      transportSessionId,
      vehicleId,
    );
  },

  /**
   * Atomically:
   *   1. Validate that the vehicle is in `ready` operational state.
   *   2. Create the transport_session row (status=active, driver+vehicle inherited).
   *   3. Materialize session_students from vehicle_students.
   *
   * If step 3 fails we delete the just-created session so the operator can
   * retry instead of being stuck with an "active" session with no students.
   *
   * Business invariants enforced here:
   *   - Only one active session per vehicle.
   *   - Only one active session per driver.
   *   - Driver + vehicle + students are inherited (no manual selection).
   */
  async startVehicleSession(
    vehicleId: string,
    startedBy = "",
  ): Promise<TransportSessionWithDetails> {
    const op = await this.getVehicleOperationalStatus(vehicleId);

    if (op.operationalStatus === "active") {
      throw new Error("Este vehículo ya tiene una sesión activa.");
    }
    if (op.operationalStatus !== "ready") {
      throw new Error(
        op.blockingReason ?? "El vehículo no está listo para iniciar una sesión.",
      );
    }
    const driver = op.driver;
    if (!driver) {
      throw new Error("El vehículo no tiene un conductor asignado.");
    }

    const conflictingDriverSession = await this.getActiveSessionForDriver(
      driver.id,
    );
    if (conflictingDriverSession) {
      throw new Error(
        `El conductor ya tiene una sesión activa en ${
          conflictingDriverSession.vehicle?.plate ?? "otro vehículo"
        }.`,
      );
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();
    const now = new Date();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: transportSessionsTableId,
      rowId: ID.unique(),
      data: {
        [TRANSPORT_SESSION_VEHICLE_COL]: vehicleId,
        [TRANSPORT_SESSION_DRIVER_COL]: driver.id,
        sessionDate: sessionDateToRow(now.toISOString()),
        shift: deriveShiftFor(now),
        startTime: now.toISOString(),
        endTime: null,
        startedBy,
        completedBy: "",
        status: "active",
        notes: "",
      },
    });

    const session = await enrichSession(mapSession(row as AppwriteRow));

    let students: SessionStudent[];
    try {
      students = await this.createSessionStudents(session.id, vehicleId);
    } catch (error) {
      await tablesDB
        .deleteRow({
          databaseId,
          tableId: transportSessionsTableId,
          rowId: session.id,
        })
        .catch(() => undefined);
      throw error;
    }

    return {
      ...session,
      students,
      summary: sessionStudentService.buildSummary(students),
    };
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
