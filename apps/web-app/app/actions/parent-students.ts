"use server";

import { revalidatePath } from "next/cache";
import {
  assignParentStudentSchema,
  type AssignParentStudentValues,
} from "@school/validations";
import { parentStudentService } from "@/services/parentStudentService";

function revalidateAll(parentId?: string, studentId?: string) {
  revalidatePath("/dashboard/parents");
  revalidatePath("/dashboard/students");
  if (parentId) revalidatePath(`/dashboard/parents/${parentId}`);
  if (studentId) revalidatePath(`/dashboard/students/${studentId}`);
}

export async function assignParentStudentAction(values: AssignParentStudentValues) {
  const parsed = assignParentStudentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: "Datos de asignación no válidos" };
  }
  try {
    await parentStudentService.assign(parsed.data);
    revalidateAll(parsed.data.parentId, parsed.data.studentId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function removeParentStudentAction(
  assignmentId: string,
  parentId: string,
  studentId: string,
) {
  try {
    await parentStudentService.remove(assignmentId);
    revalidateAll(parentId, studentId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
