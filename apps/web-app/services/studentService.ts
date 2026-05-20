import { ID, Query } from "appwrite";
import { getServerStorage, getServerTablesDB } from "@/lib/appwrite-session";
import { mapStudent } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { ListParams, PaginatedResult } from "@school/types";
import type {
  Student,
  StudentInput,
  StudentWithParents,
  StudentWithTransport,
} from "@school/types";
import { parentStudentService } from "@/services/parentStudentService";
import { vehicleStudentService } from "@/services/vehicleStudentService";

const DEFAULT_PAGE_SIZE = 10;

function buildStudentListQueries(params: ListParams): string[] {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const queries: string[] = [
    Query.limit(pageSize),
    Query.offset((page - 1) * pageSize),
  ];

  if (typeof params.status === "boolean") {
    queries.push(Query.equal("status", params.status));
  }

  const search = params.search?.trim();
  if (search) {
    queries.push(
      Query.or([
        Query.startsWith("fullName", search),
        Query.startsWith("grade", search),
      ]),
    );
  }

  return queries;
}

export const studentService = {
  async list(params: ListParams = {}): Promise<PaginatedResult<Student>> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, studentsTableId } = getTablesConfig();
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

    const result = await tablesDB.listRows({
      databaseId,
      tableId: studentsTableId,
      queries: buildStudentListQueries(params),
      total: true,
    });

    const total = result.total ?? result.rows.length;
    return {
      items: (result.rows as AppwriteRow[]).map(mapStudent),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getById(id: string): Promise<Student | null> {
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
  },

  async getByIdWithParents(id: string): Promise<StudentWithParents | null> {
    const student = await this.getById(id);
    if (!student) return null;
    const assignments = await parentStudentService.listByStudentId(id);
    return { ...student, assignments };
  },

  async getByIdWithTransport(id: string): Promise<StudentWithTransport | null> {
    const student = await this.getById(id);
    if (!student) return null;

    const [vehicleAssignmentHistory, currentVehicleAssignment] = await Promise.all([
      vehicleStudentService.listByStudentId(id),
      vehicleStudentService.getStudentCurrentVehicle(id),
    ]);

    return {
      ...student,
      currentVehicleAssignment,
      vehicleAssignmentHistory,
    };
  },

  async create(input: StudentInput): Promise<Student> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, studentsTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: studentsTableId,
      rowId: ID.unique(),
      data: {
        ...input,
        photo: input.photo ?? null,
      },
    });
    return mapStudent(row as AppwriteRow);
  },

  async update(id: string, input: StudentInput): Promise<Student> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, studentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: studentsTableId,
      rowId: id,
      data: {
        ...input,
        photo: input.photo ?? null,
      },
    });
    return mapStudent(row as AppwriteRow);
  },

  async delete(id: string): Promise<void> {
    const student = await this.getById(id);
    if (!student) return;

    await parentStudentService.removeAllForStudent(id);

    if (student.photo) {
      try {
        const { storageBucketId } = getTablesConfig();
        if (storageBucketId) {
          const storage = await getServerStorage();
          await storage.deleteFile({
            bucketId: storageBucketId,
            fileId: student.photo,
          });
        }
      } catch {
        // Photo may already be deleted
      }
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, studentsTableId } = getTablesConfig();
    await tablesDB.deleteRow({
      databaseId,
      tableId: studentsTableId,
      rowId: id,
    });
  },

  async uploadPhoto(file: File): Promise<string> {
    const { storageBucketId } = getTablesConfig();
    if (!storageBucketId) {
      throw new Error("Configure NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID para subir fotos");
    }
    const storage = await getServerStorage();
    const uploaded = await storage.createFile({
      bucketId: storageBucketId,
      fileId: ID.unique(),
      file,
    });
    return uploaded.$id;
  },

  async listAllActive(): Promise<Student[]> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, studentsTableId } = getTablesConfig();
    const result = await tablesDB.listRows({
      databaseId,
      tableId: studentsTableId,
      queries: [
        Query.equal("status", true),
        Query.limit(500),
        Query.orderAsc("fullName"),
      ],
    });
    return (result.rows as AppwriteRow[]).map(mapStudent);
  },
};

