import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapDriver, mapVehicle } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  readDriverIdFromRow,
  readVehicleIdFromRow,
  VEHICLE_DRIVER_DRIVER_COL,
  VEHICLE_DRIVER_VEHICLE_COL,
} from "@/lib/vehicle-drivers-relations";
import type { Driver } from "@school/types";
import type { Vehicle } from "@school/types";
import type {
  AssignDriverToVehicleInput,
  VehicleDriverAssignment,
} from "@school/types";
import { isActiveVehicleDriverAssignment } from "@school/types";

const JUNCTION_FETCH_LIMIT = 500;

function mapAssignment(row: AppwriteRow): VehicleDriverAssignment {
  const vehicleRef = row[VEHICLE_DRIVER_VEHICLE_COL];
  const driverRef = row[VEHICLE_DRIVER_DRIVER_COL];
  const unassignedRaw = row.unassignedAt;

  return {
    id: row.$id,
    vehicleId: readVehicleIdFromRow(row),
    driverId: readDriverIdFromRow(row),
    isPrimary: Boolean(row.isPrimary ?? true),
    assignedAt: String(row.assignedAt ?? row.$createdAt ?? ""),
    unassignedAt:
      unassignedRaw === null || unassignedRaw === undefined || unassignedRaw === ""
        ? null
        : String(unassignedRaw),
    status: row.status === false ? false : Boolean(row.status ?? true),
    vehicle:
      vehicleRef && typeof vehicleRef === "object"
        ? mapVehicle(vehicleRef as AppwriteRow)
        : null,
    driver:
      driverRef && typeof driverRef === "object"
        ? mapDriver(driverRef as AppwriteRow)
        : null,
  };
}

function sortByAssignedDesc(
  assignments: VehicleDriverAssignment[],
): VehicleDriverAssignment[] {
  return [...assignments].sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
  );
}

async function listJunctionRows(queries: string[]): Promise<AppwriteRow[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, vehicleDriversTableId } = getTablesConfig();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: vehicleDriversTableId,
    queries,
  });
  return result.rows as AppwriteRow[];
}

async function listByColumn(column: string, rowId: string): Promise<AppwriteRow[]> {
  const match = (row: AppwriteRow) =>
    column === VEHICLE_DRIVER_VEHICLE_COL
      ? readVehicleIdFromRow(row) === rowId
      : readDriverIdFromRow(row) === rowId;

  try {
    return await listJunctionRows([Query.equal(column, rowId), Query.limit(JUNCTION_FETCH_LIMIT)]);
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
  }

  const all = await listJunctionRows([Query.limit(JUNCTION_FETCH_LIMIT)]);
  return all.filter(match);
}

async function fetchDriverRow(id: string): Promise<Driver | null> {
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
}

async function fetchVehicleRow(id: string): Promise<Vehicle | null> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, vehiclesTableId } = getTablesConfig();
  try {
    const row = await tablesDB.getRow({
      databaseId,
      tableId: vehiclesTableId,
      rowId: id,
    });
    return mapVehicle(row as AppwriteRow);
  } catch {
    return null;
  }
}

async function listActiveDriversFromTable(): Promise<Driver[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, driversTableId } = getTablesConfig();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: driversTableId,
    queries: [Query.equal("status", true), Query.limit(500), Query.orderAsc("fullName")],
  });
  return (result.rows as AppwriteRow[]).map(mapDriver);
}

async function enrichAssignments(
  assignments: VehicleDriverAssignment[],
): Promise<VehicleDriverAssignment[]> {
  const driverCache = new Map<string, Driver | null>();
  const vehicleCache = new Map<string, Vehicle | null>();

  return Promise.all(
    assignments.map(async (assignment) => {
      let { driver, vehicle } = assignment;

      if (!driver && assignment.driverId) {
        if (!driverCache.has(assignment.driverId)) {
          driverCache.set(assignment.driverId, await fetchDriverRow(assignment.driverId));
        }
        driver = driverCache.get(assignment.driverId) ?? null;
      }

      if (!vehicle && assignment.vehicleId) {
        if (!vehicleCache.has(assignment.vehicleId)) {
          vehicleCache.set(assignment.vehicleId, await fetchVehicleRow(assignment.vehicleId));
        }
        vehicle = vehicleCache.get(assignment.vehicleId) ?? null;
      }

      return { ...assignment, driver, vehicle };
    }),
  );
}

async function getAssignmentById(id: string): Promise<VehicleDriverAssignment | null> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, vehicleDriversTableId } = getTablesConfig();
  try {
    const row = await tablesDB.getRow({
      databaseId,
      tableId: vehicleDriversTableId,
      rowId: id,
    });
    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  } catch {
    return null;
  }
}

async function listAllActiveAssignments(): Promise<VehicleDriverAssignment[]> {
  const rows = await listJunctionRows([Query.limit(JUNCTION_FETCH_LIMIT)]);
  const assignments = sortByAssignedDesc(await enrichAssignments(rows.map(mapAssignment)));
  return assignments.filter(isActiveVehicleDriverAssignment);
}

async function loadVehicleDrivers(
  vehicleId: string,
  options: { activeOnly?: boolean } = {},
): Promise<VehicleDriverAssignment[]> {
  const rows = await listByColumn(VEHICLE_DRIVER_VEHICLE_COL, vehicleId);
  let assignments = sortByAssignedDesc(await enrichAssignments(rows.map(mapAssignment)));
  if (options.activeOnly) {
    assignments = assignments.filter(isActiveVehicleDriverAssignment);
  }
  return assignments;
}

async function assertDriverAvailableForAssignment(
  driverId: string,
  vehicleId: string,
): Promise<void> {
  const rows = await listByColumn(VEHICLE_DRIVER_DRIVER_COL, driverId);
  const assignments = sortByAssignedDesc(await enrichAssignments(rows.map(mapAssignment)));
  const activeForDriver = assignments.find(isActiveVehicleDriverAssignment);
  if (activeForDriver && activeForDriver.vehicleId !== vehicleId) {
    const plate = activeForDriver.vehicle?.plate ?? activeForDriver.vehicleId;
    throw new Error(
      `El conductor ya está asignado al vehículo activo ${plate}. Finalice esa asignación antes de reasignar.`,
    );
  }
}

export const vehicleDriverService = {
  async getVehicleDrivers(
    vehicleId: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<VehicleDriverAssignment[]> {
    return loadVehicleDrivers(vehicleId, options);
  },

  async getDriverVehicles(
    driverId: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<VehicleDriverAssignment[]> {
    const rows = await listByColumn(VEHICLE_DRIVER_DRIVER_COL, driverId);
    let assignments = sortByAssignedDesc(await enrichAssignments(rows.map(mapAssignment)));
    if (options.activeOnly) {
      assignments = assignments.filter(isActiveVehicleDriverAssignment);
    }
    return assignments;
  },

  /** Active assignment for a vehicle (at most one operationally). */
  async getActiveAssignmentForVehicle(
    vehicleId: string,
  ): Promise<VehicleDriverAssignment | null> {
    const active = await loadVehicleDrivers(vehicleId, { activeOnly: true });
    return active[0] ?? null;
  },

  /** Alias for operational UI. */
  async getCurrentVehicleDriver(vehicleId: string): Promise<VehicleDriverAssignment | null> {
    return this.getActiveAssignmentForVehicle(vehicleId);
  },

  /** Active assignment for a driver (at most one operationally). */
  async getActiveAssignmentForDriver(
    driverId: string,
  ): Promise<VehicleDriverAssignment | null> {
    const active = await this.getDriverVehicles(driverId, { activeOnly: true });
    return active[0] ?? null;
  },

  /** Alias — returns the active vehicle assignment for a driver. */
  async getDriverCurrentVehicle(
    driverId: string,
  ): Promise<VehicleDriverAssignment | null> {
    return this.getActiveAssignmentForDriver(driverId);
  },

  /**
   * Active drivers without an active vehicle assignment.
   * `includeDriverId` keeps the current driver visible on edit forms.
   */
  async getDriverSelectOptions(options?: {
    includeDriverId?: string;
  }): Promise<
    { id: string; label: string; hint?: string; disabled?: boolean }[]
  > {
    const available = await this.getAvailableDrivers(options);
    const availableIds = new Set(available.map((d) => d.id));
    const allActive = await listActiveDriversFromTable();

    return allActive.map((driver) => ({
      id: driver.id,
      label: driver.fullName,
      hint: driver.licenseNumber,
      disabled: !availableIds.has(driver.id),
    }));
  },

  async getAvailableDrivers(options?: {
    includeDriverId?: string;
  }): Promise<Driver[]> {
    const [drivers, activeAssignments] = await Promise.all([
      listActiveDriversFromTable(),
      listAllActiveAssignments(),
    ]);

    const assignedDriverIds = new Set(
      activeAssignments
        .map((a) => a.driverId)
        .filter((id) => id && id !== options?.includeDriverId),
    );

    return drivers.filter(
      (driver) =>
        driver.status && (!assignedDriverIds.has(driver.id) || driver.id === options?.includeDriverId),
    );
  },

  async hasActiveAssignment(vehicleId: string, driverId: string): Promise<boolean> {
    const assignment = await this.getActiveAssignmentForVehicle(vehicleId);
    return assignment?.driverId === driverId;
  },

  async assignDriverToVehicle(
    input: AssignDriverToVehicleInput,
  ): Promise<VehicleDriverAssignment> {
    const [vehicle, driver] = await Promise.all([
      fetchVehicleRow(input.vehicleId),
      fetchDriverRow(input.driverId),
    ]);

    if (!vehicle) {
      throw new Error("Vehículo no encontrado.");
    }
    if (!vehicle.status) {
      throw new Error("Solo se pueden asignar conductores a vehículos activos.");
    }
    if (!driver) {
      throw new Error("Conductor no encontrado.");
    }
    if (!driver.status) {
      throw new Error("Solo se pueden asignar conductores activos.");
    }

    const currentForVehicle = await this.getActiveAssignmentForVehicle(input.vehicleId);
    if (currentForVehicle && currentForVehicle.driverId !== input.driverId) {
      throw new Error(
        "Este vehículo ya tiene un conductor activo. Use el formulario de edición para reemplazarlo.",
      );
    }

    if (await this.hasActiveAssignment(input.vehicleId, input.driverId)) {
      return (await this.getActiveAssignmentForVehicle(input.vehicleId))!;
    }

    await assertDriverAvailableForAssignment(input.driverId, input.vehicleId);

    const tablesDB = await getServerTablesDB();
    const { databaseId, vehicleDriversTableId } = getTablesConfig();
    const now = new Date().toISOString();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: vehicleDriversTableId,
      rowId: ID.unique(),
      data: {
        [VEHICLE_DRIVER_VEHICLE_COL]: input.vehicleId,
        [VEHICLE_DRIVER_DRIVER_COL]: input.driverId,
        isPrimary: true,
        assignedAt: input.assignedAt || now,
        status: true,
      },
    });

    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  },

  async replaceVehicleDriver(
    vehicleId: string,
    newDriverId: string,
  ): Promise<VehicleDriverAssignment> {
    const current = await this.getActiveAssignmentForVehicle(vehicleId);
    if (current?.driverId === newDriverId) {
      return current;
    }

    if (current) {
      await this.unassignDriver(current.id);
    }

    return this.assignDriverToVehicle({
      vehicleId,
      driverId: newDriverId,
      assignedAt: new Date().toISOString(),
      isPrimary: true,
      status: true,
    });
  },

  async unassignDriver(assignmentId: string): Promise<VehicleDriverAssignment> {
    const assignment = await getAssignmentById(assignmentId);
    if (!assignment) {
      throw new Error("Asignación no encontrada.");
    }
    if (!isActiveVehicleDriverAssignment(assignment)) {
      throw new Error("Esta asignación ya está inactiva.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, vehicleDriversTableId } = getTablesConfig();
    const now = new Date().toISOString();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: vehicleDriversTableId,
      rowId: assignmentId,
      data: {
        unassignedAt: now,
        status: false,
        isPrimary: false,
      },
    });

    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  },
};
