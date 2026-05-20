import { Query } from "appwrite";
import { getTablesDB } from "@/lib/appwrite";
import { mapSessionStudent, mapStudent } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import {
  readSessionIdFromStudentRow,
  SESSION_STUDENT_SESSION_COL,
  SESSION_STUDENT_STUDENT_COL,
} from "@/lib/session-relations";
import { getTablesConfig } from "@/lib/tables-config";
import { notificationService } from "@/services/notificationService";
import type { SessionStudent } from "@school/types";

const JUNCTION_LIMIT = 500;

function sortByPickupOrder(students: SessionStudent[]): SessionStudent[] {
  return [...students].sort((a, b) => a.pickupOrder - b.pickupOrder);
}

async function listBySessionId(sessionId: string): Promise<AppwriteRow[]> {
  const tablesDB = getTablesDB();
  const { databaseId, sessionStudentsTableId } = getTablesConfig();

  try {
    const result = await tablesDB.listRows({
      databaseId,
      tableId: sessionStudentsTableId,
      queries: [
        Query.equal(SESSION_STUDENT_SESSION_COL, sessionId),
        Query.limit(JUNCTION_LIMIT),
      ],
    });
    return result.rows as AppwriteRow[];
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
  }

  const all = await tablesDB.listRows({
    databaseId,
    tableId: sessionStudentsTableId,
    queries: [Query.limit(JUNCTION_LIMIT)],
  });
  return (all.rows as AppwriteRow[]).filter(
    (row) => readSessionIdFromStudentRow(row) === sessionId,
  );
}

async function enrichStudents(students: SessionStudent[]): Promise<SessionStudent[]> {
  const tablesDB = getTablesDB();
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

export const sessionStudentService = {
  async getSessionStudents(sessionId: string): Promise<SessionStudent[]> {
    const rows = await listBySessionId(sessionId);
    const students = sortByPickupOrder(
      await enrichStudents(rows.map((row) => mapSessionStudent(row))),
    );
    return students;
  },

  async markBoarded(id: string): Promise<SessionStudent> {
    const now = new Date().toISOString();
    const tablesDB = getTablesDB();
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
      },
    });

    const [enriched] = await enrichStudents([mapSessionStudent(row as AppwriteRow)]);
    await notificationService.notifyStudentBoarded(enriched).catch(() => undefined);
    return enriched;
  },

  async markDroppedOff(id: string): Promise<SessionStudent> {
    const now = new Date().toISOString();
    const tablesDB = getTablesDB();
    const { databaseId, sessionStudentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: sessionStudentsTableId,
      rowId: id,
      data: {
        droppedOff: true,
        dropoffTime: now,
        status: "dropped_off",
      },
    });

    const [enriched] = await enrichStudents([mapSessionStudent(row as AppwriteRow)]);
    await notificationService.notifyStudentDroppedOff(enriched).catch(() => undefined);
    return enriched;
  },

  async markAbsent(id: string): Promise<SessionStudent> {
    const tablesDB = getTablesDB();
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
    await notificationService.notifyStudentAbsent(enriched).catch(() => undefined);
    return enriched;
  },
};
