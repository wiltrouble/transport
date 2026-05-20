import { NextResponse } from "next/server";
import { Account, Client, Query } from "node-appwrite";
import { z } from "zod";
import { getAppwriteAdminConfig, getAdminTablesDB } from "@/lib/appwrite-admin";
import { mapDriver } from "@/lib/mappers";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import { adminNotificationService } from "@/services/notificationService";
import type { NotificationType } from "@school/types";

const bodySchema = z.object({
  type: z.enum([
    "student_boarded",
    "student_dropped_off",
    "student_absent",
    "session_started",
    "session_completed",
    "vehicle_arriving",
  ]),
  studentId: z.string().min(1),
  transportSessionId: z.string().min(1),
  studentName: z.string().optional(),
});

function titlesForType(
  type: NotificationType,
  name: string,
): { title: string; message: string } {
  switch (type) {
    case "student_boarded":
      return {
        title: `${name} abordó el vehículo`,
        message: `${name} fue registrado como abordado en el transporte escolar.`,
      };
    case "student_dropped_off":
      return {
        title: `${name} llegó a destino`,
        message: `${name} fue registrado como entregado en su destino.`,
      };
    case "student_absent":
      return {
        title: `${name} no asistió`,
        message: `${name} fue marcado como ausente en el transporte de hoy.`,
      };
    default:
      return {
        title: "Actualización de transporte",
        message: `Novedad sobre ${name}.`,
      };
  }
}

async function getActiveDriverByAppwriteUserId(appwriteUserId: string) {
  const tablesDB = getAdminTablesDB();
  const { databaseId, driversTableId } = getTablesConfig();

  try {
    const result = await tablesDB.listRows({
      databaseId,
      tableId: driversTableId,
      queries: [Query.equal("appwriteUserId", appwriteUserId), Query.limit(1)],
    });
    if (result.rows.length === 0) return null;
    const driver = mapDriver(result.rows[0] as AppwriteRow);
    return driver.status ? driver : null;
  } catch {
    const all = await tablesDB.listRows({
      databaseId,
      tableId: driversTableId,
      queries: [Query.limit(200)],
    });
    const match = (all.rows as AppwriteRow[]).find(
      (row) => String(row.appwriteUserId ?? "") === appwriteUserId,
    );
    if (!match) return null;
    const driver = mapDriver(match);
    return driver.status ? driver : null;
  }
}

async function verifyDriverAuth(sessionSecret: string | null, jwt: string | null) {
  const { endpoint, projectId } = getAppwriteAdminConfig();
  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  if (jwt) {
    client.setJWT(jwt);
  } else if (sessionSecret) {
    client.setSession(sessionSecret);
  } else {
    return null;
  }
  const account = new Account(client);
  const user = await account.get();
  return getActiveDriverByAppwriteUserId(user.$id);
}

export async function POST(request: Request) {
  const sessionSecret = request.headers.get("x-appwrite-session")?.trim() || null;
  const jwt = request.headers.get("x-appwrite-jwt")?.trim() || null;
  if (!sessionSecret && !jwt) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  try {
    const driver = await verifyDriverAuth(sessionSecret, jwt);
    if (!driver) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const name = body.studentName?.trim() || "Su hijo/a";
    const { title, message } = titlesForType(body.type, name);

    const created = await adminNotificationService.notifyParentsForStudent({
      studentId: body.studentId,
      transportSessionId: body.transportSessionId,
      type: body.type,
      title,
      message,
    });

    if (created === 0) {
      return NextResponse.json(
        {
          ok: false,
          created: 0,
          error:
            "No hay padres vinculados en parent_student para este estudiante. Vincúlelos en el panel admin.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear notificaciones.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
