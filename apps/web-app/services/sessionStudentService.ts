import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapStudent } from "@/lib/mappers";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  readSessionIdFromStudentRow,
  readStudentIdFromSessionStudentRow,
  SESSION_STUDENT_SESSION_COL,
  SESSION_STUDENT_STUDENT_COL,
} from "@/lib/session-relations";
import type { SessionStudentStatus } from "@school/utils";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { SessionStudent } from "@school/types";
import { vehicleStudentService } from "@/services/vehicleStudentService";

const JUNCTION_LIMIT = 500;

/** Appwrite `session_students.pickupOrder` is integer (unlike `vehicle_students`). */
function pickupOrderForSessionRow(value: number): number {
  const order = Math.trunc(Number(value));
  return Number.isFinite(order) && order > 0 ? order : 1;
}

function mapSessionStudent(row: AppwriteRow): SessionStudent {
  const studentRef = row[SESSION_STUDENT_STUDENT_COL];
  return {
    id: row.$id,
    transportSessionId: readSessionIdFromStudentRow(row),
    studentId: readStudentIdFromSessionStudentRow(row),
    pickupOrder: Number(row.pickupOrder ?? 0),
    pickupTime: String(row.pickupTime ?? ""),
    dropoffTime: String(row.dropoffTime ?? ""),
    boarded: Boolean(row.boarded ?? false),
    droppedOff: Boolean(row.droppedOff ?? false),
    absent: Boolean(row.absent ?? false),
    boardedLatitude:
      row.boardedLatitude === null || row.boardedLatitude === undefined
        ? null
        : Number(row.boardedLatitude),
    boardedLongitude:
      row.boardedLongitude === null || row.boardedLongitude === undefined
        ? null
        : Number(row.boardedLongitude),
    droppedLatitude:
      row.droppedLatitude === null || row.droppedLatitude === undefined
        ? null
        : Number(row.droppedLatitude),
    droppedLongitude:
      row.droppedLongitude === null || row.droppedLongitude === undefined
        ? null
        : Number(row.droppedLongitude),
    notes: String(row.notes ?? ""),
    status: String(row.status ?? "pending") as SessionStudentStatus,
    student:
      studentRef && typeof studentRef === "object"
        ? mapStudent(studentRef as AppwriteRow)
        : null,
  };
}

function sortByPickupOrder(students: SessionStudent[]): SessionStudent[] {
  return [...students].sort((a, b) => a.pickupOrder - b.pickupOrder);
}

async function listSessionStudentRows(queries: string[]): Promise<AppwriteRow[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, sessionStudentsTableId } = getTablesConfig();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: sessionStudentsTableId,
    queries,
  });
  return result.rows as AppwriteRow[];
}

async function listBySessionId(sessionId: string): Promise<AppwriteRow[]> {
  try {
    return await listSessionStudentRows([
      Query.equal(SESSION_STUDENT_SESSION_COL, sessionId),
      Query.limit(JUNCTION_LIMIT),
    ]);
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
  }
  const all = await listSessionStudentRows([Query.limit(JUNCTION_LIMIT)]);
  return all.filter((row) => readSessionIdFromStudentRow(row) === sessionId);
}

async function enrichStudents(students: SessionStudent[]): Promise<SessionStudent[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, studentsTableId } = getTablesConfig();
  const cache = new Map<string, SessionStudent["student"]>();

  return Promise.all(
    students.map(async (entry) => {
      if (entry.student || !entry.studentId) return entry;
      if (!cache.has(entry.studentId)) {
        try {
          const row = await tablesDB.getRow({
            databaseId,
            tableId: studentsTableId,
            rowId: entry.studentId,
          });
          cache.set(entry.studentId, mapStudent(row as AppwriteRow));
        } catch {
          cache.set(entry.studentId, null);
        }
      }
      return { ...entry, student: cache.get(entry.studentId) ?? null };
    }),
  );
}

function buildSummary(students: SessionStudent[]) {
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

export const sessionStudentService = {
  buildSummary,

  async getSessionStudents(sessionId: string): Promise<SessionStudent[]> {
    const rows = await listBySessionId(sessionId);
    const students = sortByPickupOrder(await enrichStudents(rows.map(mapSessionStudent)));
    return students;
  },

  async loadVehicleStudents(
    transportSessionId: string,
    vehicleId: string,
  ): Promise<SessionStudent[]> {
    const activeAssignments = await vehicleStudentService.listActiveByVehicleId(vehicleId);

    if (activeAssignments.length === 0) {
      return [];
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, sessionStudentsTableId } = getTablesConfig();

    const created: SessionStudent[] = [];
    for (const assignment of activeAssignments) {
      const row = await tablesDB.createRow({
        databaseId,
        tableId: sessionStudentsTableId,
        rowId: ID.unique(),
        data: {
          [SESSION_STUDENT_SESSION_COL]: transportSessionId,
          [SESSION_STUDENT_STUDENT_COL]: assignment.studentId,
          pickupOrder: pickupOrderForSessionRow(assignment.pickupOrder),
          pickupTime: assignment.pickupTime ?? "",
          dropoffTime: assignment.dropoffTime ?? "",
          boarded: false,
          droppedOff: false,
          absent: false,
          notes: "",
          status: "pending",
        },
      });
      created.push(mapSessionStudent(row as AppwriteRow));
    }

    return sortByPickupOrder(await enrichStudents(created));
  },

  async getById(id: string): Promise<SessionStudent | null> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, sessionStudentsTableId } = getTablesConfig();
    try {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: sessionStudentsTableId,
        rowId: id,
      });
      const [enriched] = await enrichStudents([mapSessionStudent(row as AppwriteRow)]);
      return enriched;
    } catch {
      return null;
    }
  },

  async markBoarded(
    id: string,
    coords?: { latitude?: number; longitude?: number },
  ): Promise<SessionStudent> {
    const now = new Date().toISOString();
    const tablesDB = await getServerTablesDB();
    const { databaseId, sessionStudentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: sessionStudentsTableId,
      rowId: id,
      data: {
        boarded: true,
        absent: false,
        pickupTime: now,
        status: "boarded",
        ...(coords?.latitude !== undefined
          ? { boardedLatitude: coords.latitude, boardedLongitude: coords.longitude ?? null }
          : {}),
      },
    });

    const [enriched] = await enrichStudents([mapSessionStudent(row as AppwriteRow)]);
    return enriched;
  },

  async markDroppedOff(
    id: string,
    coords?: { latitude?: number; longitude?: number },
  ): Promise<SessionStudent> {
    const now = new Date().toISOString();
    const tablesDB = await getServerTablesDB();
    const { databaseId, sessionStudentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: sessionStudentsTableId,
      rowId: id,
      data: {
        droppedOff: true,
        dropoffTime: now,
        status: "dropped_off",
        ...(coords?.latitude !== undefined
          ? { droppedLatitude: coords.latitude, droppedLongitude: coords.longitude ?? null }
          : {}),
      },
    });

    const [enriched] = await enrichStudents([mapSessionStudent(row as AppwriteRow)]);
    return enriched;
  },

  async markAbsent(id: string): Promise<SessionStudent> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, sessionStudentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: sessionStudentsTableId,
      rowId: id,
      data: {
        absent: true,
        boarded: false,
        droppedOff: false,
        status: "absent",
      },
    });

    const [enriched] = await enrichStudents([mapSessionStudent(row as AppwriteRow)]);
    return enriched;
  },

  async updateNotes(id: string, notes: string): Promise<SessionStudent> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, sessionStudentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: sessionStudentsTableId,
      rowId: id,
      data: { notes },
    });

    const [enriched] = await enrichStudents([mapSessionStudent(row as AppwriteRow)]);
    return enriched;
  },

  async countBoardedToday(): Promise<number> {
    const rows = await listSessionStudentRows([Query.limit(JUNCTION_LIMIT)]);
    const today = new Date().toISOString().slice(0, 10);
    return rows.filter((row) => {
      const status = String(row.status ?? "");
      const pickup = String(row.pickupTime ?? "");
      return status === "boarded" && pickup.startsWith(today);
    }).length;
  },

  async countAbsentToday(): Promise<number> {
    const rows = await listSessionStudentRows([Query.limit(JUNCTION_LIMIT)]);
    const today = new Date().toISOString().slice(0, 10);
    return rows.filter((row) => {
      const status = String(row.status ?? "");
      const updated = String(row.$updatedAt ?? "");
      return status === "absent" && (updated.startsWith(today) || String(row.pickupTime ?? "").startsWith(today));
    }).length;
  },
};
