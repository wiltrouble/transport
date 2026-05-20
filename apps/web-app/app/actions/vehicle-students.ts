"use server";

import { revalidatePath } from "next/cache";
import {
  assignStudentToVehicleSchema,
  reorderVehicleStudentsSchema,
  updateVehicleStudentSchema,
  type AssignStudentToVehicleValues,
  type ReorderVehicleStudentsValues,
  type UpdateVehicleStudentValues,
} from "@school/validations";
import { vehicleStudentService } from "@/services/vehicleStudentService";

function revalidateVehicleStudents(vehicleId: string, studentId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vehicles");
  revalidatePath(`/dashboard/vehicles/${vehicleId}`);
  revalidatePath(`/dashboard/vehicles/${vehicleId}/students`);
  if (studentId) {
    revalidatePath(`/dashboard/students/${studentId}`);
  }
}

export async function assignStudentToVehicleAction(values: AssignStudentToVehicleValues) {
  const parsed = assignStudentToVehicleSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await vehicleStudentService.assignStudentToVehicle(parsed.data);
    revalidateVehicleStudents(parsed.data.vehicleId, parsed.data.studentId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function updateVehicleStudentAction(
  assignmentId: string,
  vehicleId: string,
  studentId: string,
  values: UpdateVehicleStudentValues,
) {
  const parsed = updateVehicleStudentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await vehicleStudentService.update(assignmentId, parsed.data);
    revalidateVehicleStudents(vehicleId, studentId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function reorderVehicleStudentsAction(values: ReorderVehicleStudentsValues) {
  const parsed = reorderVehicleStudentsSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await vehicleStudentService.reorderStudents(
      parsed.data.vehicleId,
      parsed.data.orderedAssignmentIds,
    );
    revalidateVehicleStudents(parsed.data.vehicleId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function unassignVehicleStudentAction(
  assignmentId: string,
  vehicleId: string,
  studentId: string,
) {
  try {
    await vehicleStudentService.unassignStudent(assignmentId);
    revalidateVehicleStudents(vehicleId, studentId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

/** @deprecated Use unassignVehicleStudentAction */
export async function removeVehicleStudentAction(
  assignmentId: string,
  vehicleId: string,
  studentId: string,
) {
  return unassignVehicleStudentAction(assignmentId, vehicleId, studentId);
}
