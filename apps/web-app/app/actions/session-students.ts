"use server";

import { revalidatePath } from "next/cache";
import {
  sessionStudentNotesSchema,
  type SessionStudentNotesValues,
} from "@school/validations";
import { sessionStudentService } from "@/services/sessionStudentService";
import { transportSessionService } from "@/services/transportSessionService";

async function assertEditable(sessionId: string) {
  const session = await transportSessionService.getById(sessionId);
  if (!session) throw new Error("Sesión no encontrada.");
  const { isSessionEditable } = await import("@school/utils");
  if (!isSessionEditable(session.status)) {
    throw new Error("La sesión está cerrada y no admite cambios.");
  }
  return session;
}

function revalidateSession(sessionId: string) {
  revalidatePath(`/dashboard/sessions/${sessionId}`);
  revalidatePath(`/dashboard/sessions/${sessionId}/manage`);
  revalidatePath("/dashboard/driver/session");
  revalidatePath("/dashboard/sessions");
}

export async function markBoardedAction(sessionStudentId: string, sessionId: string) {
  try {
    await assertEditable(sessionId);
    await sessionStudentService.markBoarded(sessionStudentId);
    revalidateSession(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function markDroppedOffAction(sessionStudentId: string, sessionId: string) {
  try {
    await assertEditable(sessionId);
    await sessionStudentService.markDroppedOff(sessionStudentId);
    revalidateSession(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function markAbsentAction(sessionStudentId: string, sessionId: string) {
  try {
    await assertEditable(sessionId);
    await sessionStudentService.markAbsent(sessionStudentId);
    revalidateSession(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function updateSessionStudentNotesAction(
  sessionStudentId: string,
  sessionId: string,
  values: SessionStudentNotesValues,
) {
  const parsed = sessionStudentNotesSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await assertEditable(sessionId);
    await sessionStudentService.updateNotes(sessionStudentId, parsed.data.notes);
    revalidateSession(sessionId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
