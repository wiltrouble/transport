import { Query } from "appwrite";
import { getTablesDB } from "@/lib/appwrite";
import { mapDriver, mapVehicle } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import {
  readDriverIdFromAssignmentRow,
  readVehicleIdFromAssignmentRow,
  VEHICLE_DRIVER_DRIVER_COL,
  VEHICLE_DRIVER_VEHICLE_COL,
} from "@/lib/session-relations";
import { getTablesConfig } from "@/lib/tables-config";
import { isActiveVehicleDriverAssignment } from "@school/types";
import type { Driver, Vehicle } from "@school/types";

const FETCH_LIMIT = 100;

export const driverService = {
  async getByAppwriteUserId(appwriteUserId: string): Promise<Driver | null> {
    const tablesDB = getTablesDB();
    const { databaseId, driversTableId } = getTablesConfig();

    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: driversTableId,
        queries: [Query.equal("appwriteUserId", appwriteUserId), Query.limit(1)],
      });
      if (result.rows.length === 0) return null;
      return mapDriver(result.rows[0] as AppwriteRow);
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
    }

    const all = await tablesDB.listRows({
      databaseId,
      tableId: driversTableId,
      queries: [Query.limit(FETCH_LIMIT)],
    });
    const match = (all.rows as AppwriteRow[]).find(
      (row) => String(row.appwriteUserId ?? "") === appwriteUserId,
    );
    return match ? mapDriver(match) : null;
  },

  async getById(id: string): Promise<Driver | null> {
    const tablesDB = getTablesDB();
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

  async getAssignedVehicle(driverId: string): Promise<Vehicle | null> {
    const tablesDB = getTablesDB();
    const { databaseId, vehicleDriversTableId, vehiclesTableId } = getTablesConfig();

    let rows: AppwriteRow[];
    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: vehicleDriversTableId,
        queries: [Query.equal(VEHICLE_DRIVER_DRIVER_COL, driverId), Query.limit(FETCH_LIMIT)],
      });
      rows = result.rows as AppwriteRow[];
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
      const all = await tablesDB.listRows({
        databaseId,
        tableId: vehicleDriversTableId,
        queries: [Query.limit(FETCH_LIMIT)],
      });
      rows = (all.rows as AppwriteRow[]).filter(
        (row) => readDriverIdFromAssignmentRow(row) === driverId,
      );
    }

    const active = rows
      .map((row) => ({
        id: row.$id,
        vehicleId: readVehicleIdFromAssignmentRow(row),
        driverId: readDriverIdFromAssignmentRow(row),
        isPrimary: Boolean(row.isPrimary ?? false),
        assignedAt: String(row.assignedAt ?? ""),
        unassignedAt:
          row.unassignedAt === null || row.unassignedAt === undefined || row.unassignedAt === ""
            ? null
            : String(row.unassignedAt),
        status: Boolean(row.status ?? true),
        vehicle:
          row[VEHICLE_DRIVER_VEHICLE_COL] && typeof row[VEHICLE_DRIVER_VEHICLE_COL] === "object"
            ? mapVehicle(row[VEHICLE_DRIVER_VEHICLE_COL] as AppwriteRow)
            : null,
        driver: null,
      }))
      .filter(isActiveVehicleDriverAssignment);

    if (active.length === 0) return null;

    const primary = active.find((a) => a.isPrimary) ?? active[0];
    if (primary.vehicle) return primary.vehicle;

    if (!primary.vehicleId) return null;

    try {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: vehiclesTableId,
        rowId: primary.vehicleId,
      });
      return mapVehicle(row as AppwriteRow);
    } catch {
      return null;
    }
  },
};
