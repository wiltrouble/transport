import { Query } from "appwrite";
import { NextResponse } from "next/server";
import { getServerTablesDB } from "@/lib/appwrite-session";
import {
  PARENT_STUDENT_PARENT_COL,
  PARENT_STUDENT_STUDENT_COL,
  readParentIdFromRow,
  readStudentIdFromRow,
} from "@/lib/parent-students-relations";
import type { AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";

/** GET /api/dev/parent-student-schema — inspect junction row shape (requires login). */
export async function GET() {
  try {
    const tablesDB = await getServerTablesDB();
    const { databaseId, parentStudentsTableId } = getTablesConfig();

    const result = await tablesDB.listRows({
      databaseId,
      tableId: parentStudentsTableId,
      queries: [Query.limit(1)],
    });

    const sample = (result.rows[0] as AppwriteRow | undefined) ?? null;

    return NextResponse.json({
      tableId: parentStudentsTableId,
      configuredColumns: {
        parent: PARENT_STUDENT_PARENT_COL,
        student: PARENT_STUDENT_STUDENT_COL,
      },
      sampleRowId: sample?.$id ?? null,
      attributeKeys: sample
        ? Object.keys(sample).filter((k) => !k.startsWith("$"))
        : [],
      sampleParentRowId: sample ? readParentIdFromRow(sample) : null,
      sampleStudentRowId: sample ? readStudentIdFromRow(sample) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to inspect schema" },
      { status: 500 },
    );
  }
}
