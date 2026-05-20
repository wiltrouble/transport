import { Query } from "appwrite";
import { NextResponse } from "next/server";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { AuthorizationError, assertAdminApiCaller } from "@/lib/authorization";
import {
  PARENT_STUDENT_PARENT_COL,
  PARENT_STUDENT_STUDENT_COL,
  readParentIdFromRow,
  readStudentIdFromRow,
} from "@/lib/parent-students-relations";
import type { AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";

/** GET /api/dev/parent-student-schema — admin-only schema inspection helper. */
export async function GET() {
  try {
    await assertAdminApiCaller();
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
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "no-session" ? 401 : 403 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to inspect schema" },
      { status: 500 },
    );
  }
}
