"use server";

import { revalidatePath } from "next/cache";
import { parentService } from "@/services/parentService";
import { parentStudentService } from "@/services/parentStudentService";
import { studentService } from "@/services/studentService";
import { parentFormSchema } from "@school/validations";
import {
  studentCreateFormSchema,
  type StudentCreateFormValues,
} from "@school/validations";
import {
  parentFirstStudentSchema,
  type ParentFirstStudentValues,
} from "@school/validations";
import { studentFormSchema, type StudentFormValues } from "@school/validations";

function revalidateStudents() {
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/parents");
}

export async function createStudentAction(
  values: StudentFormValues,
  photoFile?: File | null,
) {
  const parsed = studentFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    let photo: string | null = parsed.data.photo ?? null;
    if (photoFile && photoFile.size > 0) {
      photo = await studentService.uploadPhoto(photoFile);
    }
    const student = await studentService.create({ ...parsed.data, photo });
    revalidateStudents();
    return { ok: true as const, id: student.id };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al crear estudiante"] },
    };
  }
}

export async function updateStudentAction(
  id: string,
  values: StudentFormValues,
  photoFile?: File | null,
) {
  const parsed = studentFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    let photo: string | null = parsed.data.photo ?? null;
    if (photoFile && photoFile.size > 0) {
      photo = await studentService.uploadPhoto(photoFile);
    }
    await studentService.update(id, { ...parsed.data, photo });
    revalidateStudents();
    revalidatePath(`/dashboard/students/${id}`);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al actualizar"] },
    };
  }
}

/**
 * Creates a student and links one parent (existing row or new parent record).
 */
export async function createStudentWithParentAction(
  values: StudentCreateFormValues,
  photoFile?: File | null,
) {
  const parsed = studentCreateFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  try {
    let photo: string | null = parsed.data.student.photo ?? null;
    if (photoFile && photoFile.size > 0) {
      photo = await studentService.uploadPhoto(photoFile);
    }

    const student = await studentService.create({
      ...parsed.data.student,
      photo,
    });

    let parentId: string;
    if (parsed.data.parentMode === "existing") {
      parentId = parsed.data.parentId!.trim();
    } else {
      const parentData = parentFormSchema.parse(parsed.data.parent);
      const parent = await parentService.create(parentData);
      parentId = parent.id;
    }

    await parentStudentService.assign({
      parentId,
      studentId: student.id,
      relationshipType: parsed.data.relationshipType,
    });

    revalidateStudents();
    revalidatePath(`/dashboard/students/${student.id}`);
    revalidatePath(`/dashboard/parents/${parentId}`);

    return { ok: true as const, id: student.id, parentId };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al registrar estudiante"] },
    };
  }
}

/**
 * Parent-first flow: create student and auto-link to the responsible parent.
 */
export async function createStudentForParentAction(
  parentId: string,
  values: ParentFirstStudentValues,
  photoFile?: File | null,
) {
  const parsed = parentFirstStudentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const parent = await parentService.getById(parentId);
  if (!parent) {
    return { ok: false as const, error: { _form: ["Padre/madre no encontrado"] } };
  }

  try {
    const { relationshipType, photo: _photoField, ...studentFields } = parsed.data;
    let photo: string | null = parsed.data.photo ?? null;
    if (photoFile && photoFile.size > 0) {
      photo = await studentService.uploadPhoto(photoFile);
    }

    const student = await studentService.create({ ...studentFields, photo });

    console.log('Parent Id:', parentId);
    console.log('Student Id:', student.id);
    console.log('Relationship Type:', relationshipType);
    await parentStudentService.assignParentToStudent({
      parentId,
      studentId: student.id,
      relationshipType,
    });

    revalidateStudents();
    revalidatePath(`/dashboard/parents/${parentId}`);
    revalidatePath(`/dashboard/parents/${parentId}/students/create`);
    revalidatePath(`/dashboard/students/${student.id}`);

    return { ok: true as const, id: student.id, parentId };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al registrar estudiante"] },
    };
  }
}

export async function deleteStudentAction(id: string) {
  try {
    await studentService.delete(id);
    revalidateStudents();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
