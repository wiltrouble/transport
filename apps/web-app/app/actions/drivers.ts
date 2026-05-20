"use server";

import { revalidatePath } from "next/cache";
import { driverFormSchema, type DriverFormValues } from "@school/validations";
import { driverProvisioningService } from "@/services/driverProvisioningService";
import { driverService } from "@/services/driverService";

function revalidateDrivers() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/drivers");
}

export async function createDriverAction(values: DriverFormValues) {
  const parsed = driverFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const result = await driverProvisioningService.provision(parsed.data);
    revalidateDrivers();
    return {
      ok: true as const,
      id: result.driver.id,
      credentials: result.credentials,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al crear conductor"] },
    };
  }
}

export async function updateDriverAction(id: string, values: DriverFormValues) {
  const parsed = driverFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await driverService.update(id, parsed.data);
    revalidateDrivers();
    revalidatePath(`/dashboard/drivers/${id}`);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al actualizar"] },
    };
  }
}

export async function deleteDriverAction(id: string) {
  try {
    await driverService.delete(id);
    revalidateDrivers();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
