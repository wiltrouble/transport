"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authorization";
import { transportSessionService } from "@/services/transportSessionService";

function revalidateSessions(sessionId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/sessions/history");
  revalidatePath("/dashboard/driver/session");
  if (sessionId) {
    revalidatePath(`/dashboard/sessions/${sessionId}`);
    revalidatePath(`/dashboard/sessions/${sessionId}/manage`);
  }
}

/**
 * Start a session for a specific vehicle. Driver, students and shift are
 * inherited from the vehicle's operational state — no manual selection allowed.
 */
export async function startVehicleSessionAction(vehicleId: string) {
  if (!vehicleId || typeof vehicleId !== "string") {
    return { ok: false as const, error: "Vehículo requerido" };
  }
  try {
    const { user } = await requireAdmin();
    const session = await transportSessionService.startVehicleSession(
      vehicleId,
      user.email ?? "",
    );
    revalidateSessions(session.id);
    return { ok: true as const, id: session.id };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function completeTransportSessionAction(sessionId: string) {
  try {
    const { user } = await requireAdmin();
    await transportSessionService.completeSession(sessionId, user.email ?? "");
    revalidateSessions(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function cancelTransportSessionAction(sessionId: string) {
  try {
    await requireAdmin();
    await transportSessionService.cancelSession(sessionId);
    revalidateSessions(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
