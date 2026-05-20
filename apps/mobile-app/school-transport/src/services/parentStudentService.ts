import { Query } from "appwrite";
import { getTablesDB } from "@/lib/appwrite";
import { mapParentStudentAssignment } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import {
  PARENT_STUDENT_PARENT_COL,
  PARENT_STUDENT_STUDENT_COL,
  readParentIdFromRow,
  readStudentIdFromRow,
} from "@/lib/parent-students-relations";
import { getTablesConfig } from "@/lib/tables-config";
import type { ParentStudentAssignment, Student } from "@school/types";

const FETCH_LIMIT = 200;

export const parentStudentService = {
  async listByParentId(parentId: string): Promise<ParentStudentAssignment[]> {
    const tablesDB = getTablesDB();
    const { databaseId, parentStudentsTableId } = getTablesConfig();

    let rows: AppwriteRow[];
    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: parentStudentsTableId,
        queries: [Query.equal(PARENT_STUDENT_PARENT_COL, parentId), Query.limit(FETCH_LIMIT)],
      });
      rows = result.rows as AppwriteRow[];
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
      const all = await tablesDB.listRows({
        databaseId,
        tableId: parentStudentsTableId,
        queries: [Query.limit(FETCH_LIMIT)],
      });
      rows = (all.rows as AppwriteRow[]).filter((r) => readParentIdFromRow(r) === parentId);
    }

    return rows.map(mapParentStudentAssignment);
  },

  async getParentChildren(parentId: string): Promise<Student[]> {
    const assignments = await this.listByParentId(parentId);
    const students = assignments
      .map((a) => a.student)
      .filter((s): s is Student => Boolean(s));
    const seen = new Set<string>();
    return students.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  },

  async getStudentIdsForParent(parentId: string): Promise<string[]> {
    const assignments = await this.listByParentId(parentId);
    return [...new Set(assignments.map((a) => a.studentId).filter(Boolean))];
  },

  async getParentIdsForStudent(studentId: string): Promise<string[]> {
    const tablesDB = getTablesDB();
    const { databaseId, parentStudentsTableId } = getTablesConfig();

    let rows: AppwriteRow[];
    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: parentStudentsTableId,
        queries: [Query.equal(PARENT_STUDENT_STUDENT_COL, studentId), Query.limit(FETCH_LIMIT)],
      });
      rows = result.rows as AppwriteRow[];
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
      const all = await tablesDB.listRows({
        databaseId,
        tableId: parentStudentsTableId,
        queries: [Query.limit(FETCH_LIMIT)],
      });
      rows = (all.rows as AppwriteRow[]).filter((r) => readStudentIdFromRow(r) === studentId);
    }

    return [...new Set(rows.map((r) => readParentIdFromRow(r)).filter(Boolean))];
  },
};
