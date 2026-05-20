import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapParent, mapStudent } from "@/lib/mappers";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  PARENT_STUDENT_PARENT_COL,
  PARENT_STUDENT_STUDENT_COL,
  readParentIdFromRow,
  readStudentIdFromRow,
} from "@/lib/parent-students-relations";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { Parent } from "@school/types";
import type {
  AssignParentStudentInput,
  ParentStudentAssignment,
  RelationshipType,
} from "@school/types";
import type { Student } from "@school/types";

function mapAssignment(row: AppwriteRow): ParentStudentAssignment {
  const parentRef = row[PARENT_STUDENT_PARENT_COL];
  const studentRef = row[PARENT_STUDENT_STUDENT_COL];

  return {
    id: row.$id,
    parentId: readParentIdFromRow(row),
    studentId: readStudentIdFromRow(row),
    relationshipType: (row.relationshipType as RelationshipType) ?? "other",
    parent:
      parentRef && typeof parentRef === "object"
        ? mapParent(parentRef as AppwriteRow)
        : null,
    student:
      studentRef && typeof studentRef === "object"
        ? mapStudent(studentRef as AppwriteRow)
        : null,
  };
}

async function listJunctionRows(queries: string[]): Promise<AppwriteRow[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, parentStudentsTableId } = getTablesConfig();

  const result = await tablesDB.listRows({
    databaseId,
    tableId: parentStudentsTableId,
    queries,
  });

  return result.rows as AppwriteRow[];
}

async function listByColumn(column: string, rowId: string): Promise<AppwriteRow[]> {
  const match = (row: AppwriteRow) =>
    column === PARENT_STUDENT_PARENT_COL
      ? readParentIdFromRow(row) === rowId
      : readStudentIdFromRow(row) === rowId;

  try {
    return await listJunctionRows([Query.equal(column, rowId), Query.limit(100)]);
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
  }

  const all = await listJunctionRows([Query.limit(500)]);
  return all.filter(match);
}

async function fetchParentRow(id: string): Promise<Parent | null> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, parentsTableId } = getTablesConfig();
  try {
    const row = await tablesDB.getRow({
      databaseId,
      tableId: parentsTableId,
      rowId: id,
    });
    return mapParent(row as AppwriteRow);
  } catch {
    return null;
  }
}

async function fetchStudentRow(id: string): Promise<Student | null> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, studentsTableId } = getTablesConfig();
  try {
    const row = await tablesDB.getRow({
      databaseId,
      tableId: studentsTableId,
      rowId: id,
    });
    return mapStudent(row as AppwriteRow);
  } catch {
    return null;
  }
}

async function enrichAssignments(
  assignments: ParentStudentAssignment[],
): Promise<ParentStudentAssignment[]> {
  const parentCache = new Map<string, Parent | null>();
  const studentCache = new Map<string, Student | null>();

  return Promise.all(
    assignments.map(async (assignment) => {
      let { parent, student } = assignment;

      if (!parent && assignment.parentId) {
        if (!parentCache.has(assignment.parentId)) {
          parentCache.set(assignment.parentId, await fetchParentRow(assignment.parentId));
        }
        parent = parentCache.get(assignment.parentId) ?? null;
      }

      if (!student && assignment.studentId) {
        if (!studentCache.has(assignment.studentId)) {
          studentCache.set(assignment.studentId, await fetchStudentRow(assignment.studentId));
        }
        student = studentCache.get(assignment.studentId) ?? null;
      }

      return { ...assignment, parent, student };
    }),
  );
}

export const parentStudentService = {
  async listByParentId(parentId: string): Promise<ParentStudentAssignment[]> {
    const rows = await listByColumn(PARENT_STUDENT_PARENT_COL, parentId);
    return enrichAssignments(rows.map(mapAssignment));
  },

  async listByStudentId(studentId: string): Promise<ParentStudentAssignment[]> {
    const rows = await listByColumn(PARENT_STUDENT_STUDENT_COL, studentId);
    return enrichAssignments(rows.map(mapAssignment));
  },

  async hasAssignmentsForParent(parentId: string): Promise<boolean> {
    const rows = await listByColumn(PARENT_STUDENT_PARENT_COL, parentId);
    return rows.length > 0;
  },

  async exists(parentId: string, studentId: string): Promise<boolean> {
    try {
      const result = await listJunctionRows([
        Query.equal(PARENT_STUDENT_PARENT_COL, parentId),
        Query.equal(PARENT_STUDENT_STUDENT_COL, studentId),
        Query.limit(1),
      ]);
      return result.length > 0;
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
    }

    const all = await listJunctionRows([Query.limit(500)]);
    return all.some(
      (row) =>
        readParentIdFromRow(row) === parentId &&
        readStudentIdFromRow(row) === studentId,
    );
  },

  async assignParentToStudent(
    input: AssignParentStudentInput,
  ): Promise<ParentStudentAssignment> {
    return this.assign(input);
  },

  async assign(input: AssignParentStudentInput): Promise<ParentStudentAssignment> {
    const duplicate = await this.exists(input.parentId, input.studentId);
    if (duplicate) {
      throw new Error("Esta relación padre-estudiante ya existe.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, parentStudentsTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: parentStudentsTableId,
      rowId: ID.unique(),
      data: {
        [PARENT_STUDENT_PARENT_COL]: input.parentId,
        [PARENT_STUDENT_STUDENT_COL]: input.studentId,
        relationshipType: input.relationshipType,
      },
    });

    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  },

  async remove(assignmentId: string): Promise<void> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, parentStudentsTableId } = getTablesConfig();
    await tablesDB.deleteRow({
      databaseId,
      tableId: parentStudentsTableId,
      rowId: assignmentId,
    });
  },

  async removeAllForStudent(studentId: string): Promise<void> {
    const assignments = await this.listByStudentId(studentId);
    await Promise.all(assignments.map((a) => this.remove(a.id)));
  },
};
