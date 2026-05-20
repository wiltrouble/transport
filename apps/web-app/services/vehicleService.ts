import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapVehicle } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { ListParams, PaginatedResult } from "@school/types";
import type {
  AssignStudentToVehicleInput,
  Vehicle,
  VehicleInput,
  VehicleListItem,
  VehicleWithDetails,
} from "@school/types";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import { vehicleStudentService } from "@/services/vehicleStudentService";

export type VehicleWizardStudentInput = {
  studentId: string;
  pickupOrder?: number;
  pickupTime?: string;
  dropoffTime?: string;
};

export type VehicleAssignmentUpdate = {
  add?: VehicleWizardStudentInput[];
  remove?: string[];
  reorder?: string[];
};

const DEFAULT_PAGE_SIZE = 10;

function buildVehicleListQueries(params: ListParams): string[] {
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
        Query.startsWith("plate", search),
        Query.startsWith("brand", search),
        Query.startsWith("model", search),
      ]),
    );
  }

  return queries;
}

function vehicleInputToRowData(input: VehicleInput) {
  return {
    plate: input.plate.trim().toUpperCase(),
    brand: input.brand,
    model: input.model,
    capacity: input.capacity,
    color: input.color,
    year: String(input.year),
    status: input.status,
  };
}

export const vehicleService = {
  async list(params: ListParams = {}): Promise<PaginatedResult<VehicleListItem>> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, vehiclesTableId } = getTablesConfig();
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

    const result = await tablesDB.listRows({
      databaseId,
      tableId: vehiclesTableId,
      queries: buildVehicleListQueries(params),
      total: true,
    });

    const items = (result.rows as AppwriteRow[]).map(mapVehicle);
    const counts = await vehicleStudentService.countByVehicleIds(items.map((v) => v.id));

    const enriched: VehicleListItem[] = items.map((vehicle) => {
      const assignmentCount = counts.get(vehicle.id) ?? 0;
      const occupancyPercent =
        vehicle.capacity > 0
          ? Math.min(100, Math.round((assignmentCount / vehicle.capacity) * 100))
          : 0;
      return { ...vehicle, assignmentCount, occupancyPercent };
    });

    const total = result.total ?? result.rows.length;
    return {
      items: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getById(id: string): Promise<Vehicle | null> {
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
  },

  async getByIdWithDetails(id: string): Promise<VehicleWithDetails | null> {
    const vehicle = await this.getById(id);
    if (!vehicle) return null;

    const [activeStudentAssignments, studentAssignmentHistory, driverAssignmentHistory, currentDriverAssignment] =
      await Promise.all([
        vehicleStudentService.listActiveByVehicleId(id),
        vehicleStudentService.listByVehicleId(id),
        vehicleDriverService.getVehicleDrivers(id),
        vehicleDriverService.getCurrentVehicleDriver(id),
      ]);

    const assignmentCount = activeStudentAssignments.length;
    const occupancyPercent =
      vehicle.capacity > 0
        ? Math.min(100, Math.round((assignmentCount / vehicle.capacity) * 100))
        : 0;

    return {
      ...vehicle,
      assignments: activeStudentAssignments,
      assignmentCount,
      occupancyPercent,
      studentAssignmentHistory,
      currentDriverAssignment,
      driverAssignmentHistory,
    };
  },

  async create(input: VehicleInput): Promise<Vehicle> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, vehiclesTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: vehiclesTableId,
      rowId: ID.unique(),
      data: vehicleInputToRowData(input),
    });
    return mapVehicle(row as AppwriteRow);
  },

  async createWithDriver(
    input: VehicleInput,
    driverId: string,
  ): Promise<{ vehicle: Vehicle; assignment: Awaited<ReturnType<typeof vehicleDriverService.assignDriverToVehicle>> }> {
    const vehicle = await this.create(input);
    try {
      const assignment = await vehicleDriverService.assignDriverToVehicle({
        vehicleId: vehicle.id,
        driverId,
        assignedAt: new Date().toISOString(),
        isPrimary: true,
        status: true,
      });
      return { vehicle, assignment };
    } catch (error) {
      await this.delete(vehicle.id).catch(() => undefined);
      throw error;
    }
  },

  /**
   * Single transactional workflow used by the create wizard:
   * 1) insert vehicle row, 2) assign driver, 3) assign students (in pickup order).
   * Any failure rolls back the vehicle row so the system never ends up with
   * a vehicle missing its mandatory driver.
   */
  async createVehicleWithAssignments(
    input: VehicleInput,
    driverId: string,
    students: VehicleWizardStudentInput[] = [],
  ): Promise<{ vehicle: Vehicle; assignedStudents: number }> {
    if (students.length > input.capacity) {
      throw new Error(
        `Estudiantes (${students.length}) supera capacidad (${input.capacity}).`,
      );
    }

    const ordered = [...students].sort(
      (a, b) => (a.pickupOrder ?? Number.MAX_SAFE_INTEGER) - (b.pickupOrder ?? Number.MAX_SAFE_INTEGER),
    );

    const { vehicle } = await this.createWithDriver(input, driverId);

    try {
      for (const s of ordered) {
        const payload: AssignStudentToVehicleInput = {
          vehicleId: vehicle.id,
          studentId: s.studentId,
          pickupTime: s.pickupTime,
          dropoffTime: s.dropoffTime,
        };
        await vehicleStudentService.assignStudentToVehicle(payload);
      }
      return { vehicle, assignedStudents: ordered.length };
    } catch (error) {
      await this.delete(vehicle.id).catch(() => undefined);
      throw error;
    }
  },

  async update(id: string, input: VehicleInput): Promise<Vehicle> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, vehiclesTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: vehiclesTableId,
      rowId: id,
      data: vehicleInputToRowData(input),
    });
    return mapVehicle(row as AppwriteRow);
  },

  async updateWithDriver(
    id: string,
    input: VehicleInput,
    driverId: string,
  ): Promise<Vehicle> {
    const vehicle = await this.update(id, input);
    const current = await vehicleDriverService.getCurrentVehicleDriver(id);
    if (current?.driverId !== driverId) {
      await vehicleDriverService.replaceVehicleDriver(id, driverId);
    }
    return vehicle;
  },

  /**
   * Update vehicle info + driver and apply student operations in one call.
   * Failures during student ops do not roll back the vehicle/driver update
   * because those have already been persisted as historical truth.
   */
  async updateVehicleAssignments(
    id: string,
    input: VehicleInput,
    driverId: string,
    studentOps: VehicleAssignmentUpdate = {},
  ): Promise<Vehicle> {
    const vehicle = await this.updateWithDriver(id, input, driverId);

    for (const aid of studentOps.remove ?? []) {
      await vehicleStudentService.unassignStudent(aid);
    }

    for (const s of studentOps.add ?? []) {
      await vehicleStudentService.assignStudentToVehicle({
        vehicleId: id,
        studentId: s.studentId,
        pickupTime: s.pickupTime,
        dropoffTime: s.dropoffTime,
      });
    }

    if (studentOps.reorder?.length) {
      await vehicleStudentService.reorderStudents(id, studentOps.reorder);
    }

    return vehicle;
  },

  async delete(id: string): Promise<void> {
    const activeDriver = await vehicleDriverService.getCurrentVehicleDriver(id);
    if (activeDriver) {
      throw new Error(
        "No se puede eliminar: el vehículo tiene un conductor activo. Finalice la asignación primero.",
      );
    }

    const hasStudents = await vehicleStudentService.hasAssignmentsForVehicle(id);
    if (hasStudents) {
      throw new Error(
        "No se puede eliminar: el vehículo tiene estudiantes asignados. Elimine las asignaciones primero.",
      );
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, vehiclesTableId } = getTablesConfig();
    await tablesDB.deleteRow({
      databaseId,
      tableId: vehiclesTableId,
      rowId: id,
    });
  },

  async count(status?: boolean): Promise<number> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, vehiclesTableId } = getTablesConfig();
    const queries = [Query.limit(1)];
    if (typeof status === "boolean") {
      queries.push(Query.equal("status", status));
    }
    const result = await tablesDB.listRows({
      databaseId,
      tableId: vehiclesTableId,
      queries,
      total: true,
    });
    return result.total ?? 0;
  },

  async listAllActive(): Promise<Vehicle[]> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, vehiclesTableId } = getTablesConfig();
    const result = await tablesDB.listRows({
      databaseId,
      tableId: vehiclesTableId,
      queries: [Query.equal("status", true), Query.limit(500), Query.orderAsc("plate")],
    });
    return (result.rows as AppwriteRow[]).map(mapVehicle);
  },
};
