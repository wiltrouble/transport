"use server";

import { revalidatePath } from "next/cache";
import { parentFormSchema, type ParentFormValues } from "@school/validations";
import { parentProvisioningService } from "@/services/parentProvisioningService";
import { parentService } from "@/services/parentService";

function revalidateParents() {
  revalidatePath("/dashboard/parents");
}

export async function createParentAction(values: ParentFormValues) {
  const parsed = parentFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const result = await parentProvisioningService.provision(parsed.data);
    revalidateParents();
    return {
      ok: true as const,
      id: result.parent.id,
      credentials: result.credentials,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al crear padre/madre"] },
    };
  }
}

export async function updateParentAction(id: string, values: ParentFormValues) {
  const parsed = parentFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await parentService.update(id, parsed.data);
    revalidateParents();
    revalidatePath(`/dashboard/parents/${id}`);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al actualizar"] },
    };
  }
}

export async function deleteParentAction(id: string) {
  try {
    await parentService.delete(id);
    revalidateParents();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
