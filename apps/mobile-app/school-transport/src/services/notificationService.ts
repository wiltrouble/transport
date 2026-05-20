import { ID, Query } from "appwrite";
import { AppwriteException } from "appwrite";
import { Channel, Realtime, type RealtimeResponseEvent } from "appwrite";
import { getAppwriteClient, getTablesDB } from "@/lib/appwrite";
import { authService } from "@/services/authService";
import { mapNotification } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import {
  NOTIFICATION_PARENT_COL,
  NOTIFICATION_SESSION_COL,
  NOTIFICATION_STUDENT_COL,
  readParentIdFromNotificationRow,
} from "@/lib/notification-relations";
import { getTablesConfig } from "@/lib/tables-config";
import { resolveWebApiBaseUrl } from "@/lib/web-api-url";
import { parentStudentService } from "@/services/parentStudentService";
import { parseUnknownAttributeName } from "@school/utils";
import type { AppNotification, NotificationType, SessionStudent } from "@school/types";

const FETCH_LIMIT = 100;

function isRowEvent(events: string[]): boolean {
  return events.some((e) => e.includes(".create") || e.includes(".update"));
}

type CreateNotificationInput = {
  parentId: string;
  studentId: string;
  transportSessionId: string;
  type: NotificationType;
  title: string;
  message: string;
};

function logNotificationIssue(message: string, error?: unknown): void {
  if (__DEV__) {
    console.warn(`[notifications] ${message}`, error ?? "");
  }
}

async function createNotificationClient(
  input: CreateNotificationInput,
): Promise<AppNotification> {
  const tablesDB = getTablesDB();
  const { databaseId, notificationsTableId } = getTablesConfig();
  const now = new Date().toISOString();

  const base: Record<string, string | boolean> = {
    [NOTIFICATION_PARENT_COL]: input.parentId,
    [NOTIFICATION_STUDENT_COL]: input.studentId,
    [NOTIFICATION_SESSION_COL]: input.transportSessionId,
    type: input.type,
    title: input.title,
    message: input.message,
    isRead: false,
    sentAt: now,
    createdAt: now,
  };

  let data = { ...base };
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const row = await tablesDB.createRow({
        databaseId,
        tableId: notificationsTableId,
        rowId: ID.unique(),
        data,
      });
      return mapNotification(row as AppwriteRow);
    } catch (error) {
      const unknown = parseUnknownAttributeName(error);
      if (unknown && unknown in data) {
        const next = { ...data };
        delete next[unknown];
        data = next;
        continue;
      }
      throw error;
    }
  }

  throw new Error("No se pudo crear la notificación (revisar columnas en Appwrite).");
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("Network request failed")) {
    return true;
  }
  return error instanceof Error && error.message.includes("Network request failed");
}

async function notifyViaServerApi(
  sessionStudent: SessionStudent,
  type: NotificationType,
): Promise<number> {
  const baseUrl = resolveWebApiBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL no configurada.");
  }

  const authHeaders = await authService.getServerAuthHeaders();
  const url = `${baseUrl}/api/mobile/notifications`;

  if (__DEV__) {
    console.info(`[notifications] POST ${url}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      type,
      studentId: sessionStudent.studentId,
      transportSessionId: sessionStudent.transportSessionId,
      studentName: sessionStudent.student?.fullName,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    created?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Error del servidor (${response.status}).`);
  }

  return payload.created ?? 0;
}

function isPermissionError(error: unknown): boolean {
  return error instanceof AppwriteException && (error.code === 401 || error.code === 403);
}

async function notifyParentsForStudentEvent(
  sessionStudent: SessionStudent,
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> {
  if (!sessionStudent.studentId || !sessionStudent.transportSessionId) {
    logNotificationIssue("Faltan studentId o transportSessionId en session_student.");
    return;
  }

  const parentIds = await parentStudentService.getParentIdsForStudent(sessionStudent.studentId);
  if (parentIds.length === 0) {
    logNotificationIssue(
      `Sin vínculos parent_student para el estudiante ${sessionStudent.studentId}.`,
    );
    return;
  }

  const apiBaseUrl = resolveWebApiBaseUrl();
  if (apiBaseUrl) {
    try {
      const created = await notifyViaServerApi(sessionStudent, type);
      if (created > 0) return;
      logNotificationIssue("El servidor no creó notificaciones (0 padres).");
    } catch (error) {
      if (isNetworkError(error)) {
        logNotificationIssue(
          `No se alcanzó el admin en ${apiBaseUrl}. Ejecute "npm run web" con acceso LAN (0.0.0.0:3000) o ajuste EXPO_PUBLIC_WEB_API_URL. Intentando Appwrite directo.`,
          error,
        );
      } else {
        logNotificationIssue("API de notificaciones falló; intentando cliente Appwrite.", error);
      }
    }
  }

  try {
    await Promise.all(
      parentIds.map((parentId) =>
        createNotificationClient({
          parentId,
          studentId: sessionStudent.studentId,
          transportSessionId: sessionStudent.transportSessionId,
          type,
          title,
          message,
        }),
      ),
    );
  } catch (error) {
    if (isPermissionError(error)) {
      logNotificationIssue(
        "Sin permiso para crear en `notifications`. Configure EXPO_PUBLIC_WEB_API_URL apuntando al admin (npm run dev en web-app) o permita create en Appwrite para usuarios autenticados.",
        error,
      );
      return;
    }
    logNotificationIssue("Error al crear notificaciones en Appwrite.", error);
  }
}

function studentDisplayName(sessionStudent: SessionStudent): string {
  return sessionStudent.student?.fullName?.trim() || "Su hijo/a";
}

export const notificationService = {
  async notifyStudentBoarded(sessionStudent: SessionStudent): Promise<void> {
    const name = studentDisplayName(sessionStudent);
    await notifyParentsForStudentEvent(
      sessionStudent,
      "student_boarded",
      `${name} abordó el vehículo`,
      `${name} fue registrado como abordado en el transporte escolar.`,
    );
  },

  async notifyStudentDroppedOff(sessionStudent: SessionStudent): Promise<void> {
    const name = studentDisplayName(sessionStudent);
    await notifyParentsForStudentEvent(
      sessionStudent,
      "student_dropped_off",
      `${name} llegó a destino`,
      `${name} fue registrado como entregado en su destino.`,
    );
  },

  async notifyStudentAbsent(sessionStudent: SessionStudent): Promise<void> {
    const name = studentDisplayName(sessionStudent);
    await notifyParentsForStudentEvent(
      sessionStudent,
      "student_absent",
      `${name} no asistió`,
      `${name} fue marcado como ausente en el transporte de hoy.`,
    );
  },

  async listForParent(parentId: string): Promise<AppNotification[]> {
    const tablesDB = getTablesDB();
    const { databaseId, notificationsTableId } = getTablesConfig();

    let rows: AppwriteRow[];
    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: notificationsTableId,
        queries: [
          Query.equal(NOTIFICATION_PARENT_COL, parentId),
          Query.orderDesc("sentAt"),
          Query.limit(FETCH_LIMIT),
        ],
      });
      rows = result.rows as AppwriteRow[];
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
      const all = await tablesDB.listRows({
        databaseId,
        tableId: notificationsTableId,
        queries: [Query.limit(FETCH_LIMIT)],
      });
      rows = (all.rows as AppwriteRow[]).filter(
        (r) => readParentIdFromNotificationRow(r) === parentId,
      );
    }

    return rows.map(mapNotification).sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );
  },

  async markNotificationAsRead(notificationId: string): Promise<AppNotification> {
    const tablesDB = getTablesDB();
    const { databaseId, notificationsTableId } = getTablesConfig();
    const row = await tablesDB.updateRow({
      databaseId,
      tableId: notificationsTableId,
      rowId: notificationId,
      data: { isRead: true },
    });
    return mapNotification(row as AppwriteRow);
  },

  async subscribeToNotifications(
    parentId: string,
    onNotification: (notification: AppNotification) => void,
  ) {
    const { databaseId, notificationsTableId } = getTablesConfig();
    const client = getAppwriteClient();
    const realtime = new Realtime(client);
    const channel = Channel.tablesdb(databaseId).table(notificationsTableId).row();

    const subscription = await realtime.subscribe(
      channel,
      (response: RealtimeResponseEvent<AppwriteRow>) => {
        if (!isRowEvent(response.events)) return;
        const payload = response.payload;
        if (!payload || typeof payload !== "object") return;
        const notification = mapNotification(payload);
        if (notification.parentId === parentId) {
          onNotification(notification);
        }
      },
    );

    return subscription;
  },
};
