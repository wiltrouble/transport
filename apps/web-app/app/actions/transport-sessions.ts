"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  createTransportSessionSchema,
  type CreateTransportSessionValues,
} from "@school/validations";
import { transportSessionService } from "@/services/transportSessionService";

function revalidateSessions(sessionId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/driver/session");
  if (sessionId) {
    revalidatePath(`/dashboard/sessions/${sessionId}`);
    revalidatePath(`/dashboard/sessions/${sessionId}/manage`);
  }
}

export async function createTransportSessionAction(values: CreateTransportSessionValues) {
  const parsed = createTransportSessionSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const user = await getAuthenticatedUser();
    const session = await transportSessionService.createSession(
      parsed.data,
      user?.email ?? "",
    );
    revalidateSessions(session.id);
    return { ok: true as const, id: session.id };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function startTransportSessionAction(sessionId: string) {
  try {
    const user = await getAuthenticatedUser();
    await transportSessionService.startSession(sessionId, user?.email ?? "");
    revalidateSessions(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function completeTransportSessionAction(sessionId: string) {
  try {
    const user = await getAuthenticatedUser();
    await transportSessionService.completeSession(sessionId, user?.email ?? "");
    revalidateSessions(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function cancelTransportSessionAction(sessionId: string) {
  try {
    await transportSessionService.cancelSession(sessionId);
    revalidateSessions(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
