import { ID, Query } from "appwrite";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapStudent, mapVehicle } from "@/lib/mappers";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  readStudentIdFromRow,
  readVehicleIdFromRow,
  VEHICLE_STUDENT_STUDENT_COL,
  VEHICLE_STUDENT_VEHICLE_COL,
} from "@/lib/vehicle-students-relations";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { Student } from "@school/types";
import type {
  AssignStudentToVehicleInput,
  UpdateVehicleStudentInput,
  VehicleOccupancy,
  VehicleStudentAssignment,
} from "@school/types";
import { isActiveVehicleStudentAssignment } from "@school/types";
import type { Vehicle } from "@school/types";

const JUNCTION_FETCH_LIMIT = 500;

function mapAssignment(row: AppwriteRow): VehicleStudentAssignment {
  const vehicleRef = row[VEHICLE_STUDENT_VEHICLE_COL];
  const studentRef = row[VEHICLE_STUDENT_STUDENT_COL];

  return {
    id: row.$id,
    vehicleId: readVehicleIdFromRow(row),
    studentId: readStudentIdFromRow(row),
    pickupOrder: Number(row.pickupOrder ?? 0),
    pickupTime: String(row.pickupTime ?? ""),
    dropoffTime: String(row.dropoffTime ?? ""),
    status: row.status === false ? false : Boolean(row.status ?? true),
    vehicle:
      vehicleRef && typeof vehicleRef === "object"
        ? mapVehicle(vehicleRef as AppwriteRow)
        : null,
    student:
      studentRef && typeof studentRef === "object"
        ? mapStudent(studentRef as AppwriteRow)
        : null,
  };
}

function sortByPickupOrder(assignments: VehicleStudentAssignment[]): VehicleStudentAssignment[] {
  return [...assignments].sort((a, b) => a.pickupOrder - b.pickupOrder);
}

function pickupOrderToRow(value: number): string {
  return String(value);
}

async function listJunctionRows(queries: string[]): Promise<AppwriteRow[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, vehicleStudentsTableId } = getTablesConfig();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: vehicleStudentsTableId,
    queries,
  });
  return result.rows as AppwriteRow[];
}

async function listByColumn(column: string, rowId: string): Promise<AppwriteRow[]> {
  const match = (row: AppwriteRow) =>
    column === VEHICLE_STUDENT_VEHICLE_COL
      ? readVehicleIdFromRow(row) === rowId
      : readStudentIdFromRow(row) === rowId;

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

async function listActiveStudentsFromTable(): Promise<Student[]> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, studentsTableId } = getTablesConfig();
  const result = await tablesDB.listRows({
    databaseId,
    tableId: studentsTableId,
    queries: [Query.equal("status", true), Query.limit(JUNCTION_FETCH_LIMIT), Query.orderAsc("fullName")],
  });
  return (result.rows as AppwriteRow[]).map(mapStudent);
}

async function enrichAssignments(
  assignments: VehicleStudentAssignment[],
): Promise<VehicleStudentAssignment[]> {
  const studentCache = new Map<string, Student | null>();
  const vehicleCache = new Map<string, Vehicle | null>();

  return Promise.all(
    assignments.map(async (assignment) => {
      let { student, vehicle } = assignment;

      if (!student && assignment.studentId) {
        if (!studentCache.has(assignment.studentId)) {
          studentCache.set(assignment.studentId, await fetchStudentRow(assignment.studentId));
        }
        student = studentCache.get(assignment.studentId) ?? null;
      }

      if (!vehicle && assignment.vehicleId) {
        if (!vehicleCache.has(assignment.vehicleId)) {
          vehicleCache.set(assignment.vehicleId, await fetchVehicleRow(assignment.vehicleId));
        }
        vehicle = vehicleCache.get(assignment.vehicleId) ?? null;
      }

      return { ...assignment, student, vehicle };
    }),
  );
}

async function getAssignmentById(id: string): Promise<VehicleStudentAssignment | null> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, vehicleStudentsTableId } = getTablesConfig();
  try {
    const row = await tablesDB.getRow({
      databaseId,
      tableId: vehicleStudentsTableId,
      rowId: id,
    });
    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  } catch {
    return null;
  }
}

async function listAllActiveAssignments(): Promise<VehicleStudentAssignment[]> {
  const rows = await listJunctionRows([Query.limit(JUNCTION_FETCH_LIMIT)]);
  const assignments = await enrichAssignments(rows.map(mapAssignment));
  return assignments.filter(isActiveVehicleStudentAssignment);
}

async function loadVehicleStudents(
  vehicleId: string,
  options: { activeOnly?: boolean } = {},
): Promise<VehicleStudentAssignment[]> {
  const rows = await listByColumn(VEHICLE_STUDENT_VEHICLE_COL, vehicleId);
  let assignments = sortByPickupOrder(await enrichAssignments(rows.map(mapAssignment)));
  if (options.activeOnly) {
    assignments = assignments.filter(isActiveVehicleStudentAssignment);
  }
  return assignments;
}

async function assertStudentAvailableForAssignment(
  studentId: string,
  vehicleId: string,
): Promise<void> {
  const rows = await listByColumn(VEHICLE_STUDENT_STUDENT_COL, studentId);
  const assignments = await enrichAssignments(rows.map(mapAssignment));
  const activeForStudent = assignments.find(isActiveVehicleStudentAssignment);
  if (activeForStudent && activeForStudent.vehicleId !== vehicleId) {
    const plate = activeForStudent.vehicle?.plate ?? activeForStudent.vehicleId;
    throw new Error(
      `El estudiante ya está asignado al vehículo activo ${plate}. Finalice esa asignación antes de reasignar.`,
    );
  }
}

export const vehicleStudentService = {
  async listByVehicleId(vehicleId: string): Promise<VehicleStudentAssignment[]> {
    return loadVehicleStudents(vehicleId);
  },

  async listActiveByVehicleId(vehicleId: string): Promise<VehicleStudentAssignment[]> {
    return loadVehicleStudents(vehicleId, { activeOnly: true });
  },

  async listByStudentId(
    studentId: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<VehicleStudentAssignment[]> {
    const rows = await listByColumn(VEHICLE_STUDENT_STUDENT_COL, studentId);
    let assignments = sortByPickupOrder(await enrichAssignments(rows.map(mapAssignment)));
    if (options.activeOnly) {
      assignments = assignments.filter(isActiveVehicleStudentAssignment);
    }
    return assignments;
  },

  async getActiveAssignmentForStudent(
    studentId: string,
  ): Promise<VehicleStudentAssignment | null> {
    const active = await this.listByStudentId(studentId, { activeOnly: true });
    return active[0] ?? null;
  },

  /** Alias — returns the active vehicle assignment for a student. */
  async getStudentCurrentVehicle(
    studentId: string,
  ): Promise<VehicleStudentAssignment | null> {
    return this.getActiveAssignmentForStudent(studentId);
  },

  /**
   * Active students without an active vehicle assignment.
   * `includeStudentIds` keeps current vehicle students visible on the assign form.
   */
  async getAvailableStudents(options?: {
    includeStudentIds?: string[];
  }): Promise<Student[]> {
    const includeSet = new Set(options?.includeStudentIds ?? []);
    const [students, activeAssignments] = await Promise.all([
      listActiveStudentsFromTable(),
      listAllActiveAssignments(),
    ]);

    const assignedStudentIds = new Set(
      activeAssignments
        .map((a) => a.studentId)
        .filter((id) => id && !includeSet.has(id)),
    );

    return students.filter(
      (student) =>
        student.status &&
        (!assignedStudentIds.has(student.id) || includeSet.has(student.id)),
    );
  },

  async getStudentSelectOptions(options?: {
    vehicleId?: string;
    includeStudentIds?: string[];
  }): Promise<
    { id: string; label: string; hint?: string; disabled?: boolean }[]
  > {
    let includeIds = options?.includeStudentIds ?? [];
    if (options?.vehicleId) {
      const current = await this.listActiveByVehicleId(options.vehicleId);
      includeIds = [...new Set([...includeIds, ...current.map((a) => a.studentId)])];
    }

    const available = await this.getAvailableStudents({ includeStudentIds: includeIds });
    const availableIds = new Set(available.map((s) => s.id));
    const allActive = await listActiveStudentsFromTable();

    return allActive.map((student) => ({
      id: student.id,
      label: student.fullName,
      hint: student.grade,
      disabled: !availableIds.has(student.id),
    }));
  },

  async hasActiveAssignment(vehicleId: string, studentId: string): Promise<boolean> {
    const active = await loadVehicleStudents(vehicleId, { activeOnly: true });
    return active.some((a) => a.studentId === studentId);
  },

  async hasAssignmentsForVehicle(vehicleId: string): Promise<boolean> {
    const active = await loadVehicleStudents(vehicleId, { activeOnly: true });
    return active.length > 0;
  },

  async countByVehicleIds(vehicleIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    vehicleIds.forEach((id) => counts.set(id, 0));
    if (vehicleIds.length === 0) return counts;

    const active = await listAllActiveAssignments();
    for (const assignment of active) {
      if (counts.has(assignment.vehicleId)) {
        counts.set(
          assignment.vehicleId,
          (counts.get(assignment.vehicleId) ?? 0) + 1,
        );
      }
    }
    return counts;
  },

  async validateVehicleCapacity(vehicleId: string): Promise<VehicleOccupancy> {
    return this.getVehicleOccupancy(vehicleId);
  },

  async getVehicleOccupancy(vehicleId: string): Promise<VehicleOccupancy> {
    const vehicle = await fetchVehicleRow(vehicleId);
    if (!vehicle) {
      throw new Error("Vehículo no encontrado");
    }
    const assignedCount = (await this.listActiveByVehicleId(vehicleId)).length;
    const availableSeats = Math.max(0, vehicle.capacity - assignedCount);
    const occupancyPercent =
      vehicle.capacity > 0
        ? Math.min(100, Math.round((assignedCount / vehicle.capacity) * 100))
        : 0;

    return {
      vehicleId,
      capacity: vehicle.capacity,
      assignedCount,
      availableSeats,
      occupancyPercent,
    };
  },

  async getNextPickupOrder(vehicleId: string): Promise<number> {
    const active = await this.listActiveByVehicleId(vehicleId);
    if (active.length === 0) return 1;
    const maxOrder = Math.max(...active.map((a) => a.pickupOrder));
    return maxOrder + 1;
  },

  async assignStudentToVehicle(
    input: AssignStudentToVehicleInput,
  ): Promise<VehicleStudentAssignment> {
    if (await this.hasActiveAssignment(input.vehicleId, input.studentId)) {
      const existing = (await this.listActiveByVehicleId(input.vehicleId)).find(
        (a) => a.studentId === input.studentId,
      );
      if (existing) return existing;
    }

    const student = await fetchStudentRow(input.studentId);
    if (!student) {
      throw new Error("Estudiante no encontrado.");
    }
    if (!student.status) {
      throw new Error("Solo se pueden asignar estudiantes activos.");
    }

    await assertStudentAvailableForAssignment(input.studentId, input.vehicleId);

    const occupancy = await this.validateVehicleCapacity(input.vehicleId);
    if (occupancy.assignedCount >= occupancy.capacity) {
      throw new Error(
        `Capacidad del vehículo alcanzada (${occupancy.capacity} asientos).`,
      );
    }

    const pickupOrder = await this.getNextPickupOrder(input.vehicleId);
    const tablesDB = await getServerTablesDB();
    const { databaseId, vehicleStudentsTableId } = getTablesConfig();

    const row = await tablesDB.createRow({
      databaseId,
      tableId: vehicleStudentsTableId,
      rowId: ID.unique(),
      data: {
        [VEHICLE_STUDENT_VEHICLE_COL]: input.vehicleId,
        [VEHICLE_STUDENT_STUDENT_COL]: input.studentId,
        pickupOrder: pickupOrderToRow(pickupOrder),
        pickupTime: input.pickupTime ?? "",
        dropoffTime: input.dropoffTime ?? "",
        status: true,
      },
    });

    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  },

  async update(
    assignmentId: string,
    input: UpdateVehicleStudentInput,
  ): Promise<VehicleStudentAssignment> {
    const tablesDB = await getServerTablesDB();
    const { databaseId, vehicleStudentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: vehicleStudentsTableId,
      rowId: assignmentId,
      data: input,
    });

    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  },

  /** Persists pickup order after drag-and-drop reorder (1-based, unique per vehicle). */
  async reorderStudents(
    vehicleId: string,
    orderedAssignmentIds: string[],
  ): Promise<VehicleStudentAssignment[]> {
    const current = await this.listActiveByVehicleId(vehicleId);
    const currentIds = new Set(current.map((a) => a.id));

    for (const id of orderedAssignmentIds) {
      if (!currentIds.has(id)) {
        throw new Error("Orden inválido: asignación no pertenece a este vehículo.");
      }
    }
    if (orderedAssignmentIds.length !== current.length) {
      throw new Error("Debe incluir todas las asignaciones activas del vehículo.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, vehicleStudentsTableId } = getTablesConfig();

    await Promise.all(
      orderedAssignmentIds.map((assignmentId, index) =>
        tablesDB.updateRow({
          databaseId,
          tableId: vehicleStudentsTableId,
          rowId: assignmentId,
          data: { pickupOrder: pickupOrderToRow(index + 1) },
        }),
      ),
    );

    return this.listActiveByVehicleId(vehicleId);
  },

  async unassignStudent(assignmentId: string): Promise<VehicleStudentAssignment> {
    const assignment = await getAssignmentById(assignmentId);
    if (!assignment) {
      throw new Error("Asignación no encontrada.");
    }
    if (!isActiveVehicleStudentAssignment(assignment)) {
      throw new Error("Esta asignación ya está inactiva.");
    }

    const tablesDB = await getServerTablesDB();
    const { databaseId, vehicleStudentsTableId } = getTablesConfig();

    const row = await tablesDB.updateRow({
      databaseId,
      tableId: vehicleStudentsTableId,
      rowId: assignmentId,
      data: { status: false },
    });

    const [enriched] = await enrichAssignments([mapAssignment(row as AppwriteRow)]);
    return enriched;
  },

  /** @deprecated Use unassignStudent to preserve history */
  async remove(assignmentId: string): Promise<void> {
    await this.unassignStudent(assignmentId);
  },

  async countAssignedStudents(): Promise<number> {
    const active = await listAllActiveAssignments();
    return active.length;
  },
};
