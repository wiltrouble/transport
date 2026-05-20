import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapParent } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { ListParams, PaginatedResult } from "@school/types";
import type { Parent, ParentInput, ParentWithStudents } from "@school/types";
import { parentStudentService } from "@/services/parentStudentService";

const DEFAULT_PAGE_SIZE = 10;

function buildParentListQueries(params: ListParams): string[] {
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
        Query.startsWith("email", search),
        Query.startsWith("phone", search),
      ]),
    );
  }

  return queries;
}

export const parentService = {
  async list(params: ListParams = {}): Promise<PaginatedResult<Parent>> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

    const result = await tablesDB.listRows({
      databaseId,
      tableId: parentsTableId,
      queries: buildParentListQueries(params),
      total: true,
    });

    const total = result.total ?? result.rows.length;
    return {
      items: (result.rows as AppwriteRow[]).map(mapParent),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getById(id: string): Promise<Parent | null> {
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
  },

  async getByIdWithStudents(id: string): Promise<ParentWithStudents | null> {
    const parent = await this.getById(id);
    if (!parent) return null;
    const assignments = await parentStudentService.listByParentId(id);
    return { ...parent, assignments };
  },

  async emailExists(email: string, excludeParentId?: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;

    const tablesDB = await getServerTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();
    const result = await tablesDB.listRows({
      databaseId,
      tableId: parentsTableId,
      queries: [Query.equal("email", normalized), Query.limit(1)],
    });

    if (result.rows.length === 0) return false;
    const found = mapParent(result.rows[0] as AppwriteRow);
    if (excludeParentId && found.id === excludeParentId) return false;
    return true;
  },

  /** Legacy path without Auth (e.g. parent-first student flow). Prefer parentProvisioningService. */
  async create(input: ParentInput): Promise<Parent> {
    if (await this.emailExists(input.email)) {
      throw new Error("Ya existe un padre/madre registrado con este correo electrónico.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: parentsTableId,
      rowId: ID.unique(),
      data: {
        ...input,
        email: input.email.trim().toLowerCase(),
        appwriteUserId: null,
      },
    });
    return mapParent(row as AppwriteRow);
  },

  async createWithAppwriteUserId(
    input: ParentInput,
    appwriteUserId: string,
  ): Promise<Parent> {
    if (await this.emailExists(input.email)) {
      throw new Error("Ya existe un padre/madre registrado con este correo electrónico.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: parentsTableId,
      rowId: ID.unique(),
      data: {
        ...input,
        email: input.email.trim().toLowerCase(),
        appwriteUserId: appwriteUserId || null,
      },
    });
    return mapParent(row as AppwriteRow);
  },

  async update(id: string, input: ParentInput): Promise<Parent> {
    if (await this.emailExists(input.email, id)) {
      throw new Error("Ya existe otro padre/madre con este correo electrónico.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: parentsTableId,
      rowId: id,
      data: {
        ...input,
        email: input.email.trim().toLowerCase(),
      },
    });
    return mapParent(row as AppwriteRow);
  },

  async delete(id: string): Promise<void> {
    const hasLinks = await parentStudentService.hasAssignmentsForParent(id);
    if (hasLinks) {
      throw new Error(
        "No se puede eliminar: el padre/madre tiene estudiantes vinculados. Elimine las asignaciones primero.",
      );
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();
    await tablesDB.deleteRow({
      databaseId,
      tableId: parentsTableId,
      rowId: id,
    });
  },

  /** For select dropdowns */
  async listAllActive(): Promise<Parent[]> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();
    const result = await tablesDB.listRows({
      databaseId,
      tableId: parentsTableId,
      queries: [
        Query.equal("status", true),
        Query.limit(500),
        Query.orderAsc("fullName"),
      ],
    });
    return (result.rows as AppwriteRow[]).map(mapParent);
  },
};

