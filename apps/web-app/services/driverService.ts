import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapDriver } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { ListParams, PaginatedResult } from "@school/types";
import type { Driver, DriverInput } from "@school/types";

const DEFAULT_PAGE_SIZE = 10;

function buildDriverListQueries(params: ListParams): string[] {
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
        Query.startsWith("licenseNumber", search),
      ]),
    );
  }

  return queries;
}

export const driverService = {
  async list(params: ListParams = {}): Promise<PaginatedResult<Driver>> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

    const result = await tablesDB.listRows({
      databaseId,
      tableId: driversTableId,
      queries: buildDriverListQueries(params),
      total: true,
    });

    const total = result.total ?? result.rows.length;
    return {
      items: (result.rows as AppwriteRow[]).map(mapDriver),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getById(id: string): Promise<Driver | null> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();
    try {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: driversTableId,
        rowId: id,
      });
      return mapDriver(row as AppwriteRow);
    } catch {
      return null;
    }
  },

  async getByAppwriteUserId(appwriteUserId: string): Promise<Driver | null> {
    if (!appwriteUserId) return null;
    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();
    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: driversTableId,
        queries: [Query.equal("appwriteUserId", appwriteUserId), Query.limit(1)],
      });
      if (result.rows.length === 0) return null;
      return mapDriver(result.rows[0] as AppwriteRow);
    } catch {
      return null;
    }
  },

  async emailExists(email: string, excludeDriverId?: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();
    const result = await tablesDB.listRows({
      databaseId,
      tableId: driversTableId,
      queries: [Query.equal("email", normalized), Query.limit(1)],
    });
    if (result.rows.length === 0) return false;
    const found = mapDriver(result.rows[0] as AppwriteRow);
    if (excludeDriverId && found.id === excludeDriverId) return false;
    return true;
  },

  async createWithAppwriteUserId(
    input: DriverInput,
    appwriteUserId: string,
  ): Promise<Driver> {
    if (await this.emailExists(input.email)) {
      throw new Error("Ya existe un conductor con este correo electrónico.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: driversTableId,
      rowId: ID.unique(),
      data: {
        ...input,
        appwriteUserId,
        email: input.email.trim().toLowerCase(),
        licenseExpiration: input.licenseExpiration.slice(0, 10),
      },
    });
    return mapDriver(row as AppwriteRow);
  },

  async update(id: string, input: DriverInput): Promise<Driver> {
    if (await this.emailExists(input.email, id)) {
      throw new Error("Ya existe otro conductor con este correo electrónico.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: driversTableId,
      rowId: id,
      data: {
        ...input,
        email: input.email.trim().toLowerCase(),
        licenseExpiration: input.licenseExpiration.slice(0, 10),
      },
    });
    return mapDriver(row as AppwriteRow);
  },

  async delete(id: string): Promise<void> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();
    await tablesDB.deleteRow({
      databaseId,
      tableId: driversTableId,
      rowId: id,
    });
  },

  async count(status?: boolean): Promise<number> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();
    const queries = [Query.limit(1)];
    if (typeof status === "boolean") {
      queries.push(Query.equal("status", status));
    }
    const result = await tablesDB.listRows({
      databaseId,
      tableId: driversTableId,
      queries,
      total: true,
    });
    return result.total ?? 0;
  },

  async listAllActive(): Promise<Driver[]> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();
    const result = await tablesDB.listRows({
      databaseId,
      tableId: driversTableId,
      queries: [Query.equal("status", true), Query.limit(500), Query.orderAsc("fullName")],
    });
    return (result.rows as AppwriteRow[]).map(mapDriver);
  },
};
