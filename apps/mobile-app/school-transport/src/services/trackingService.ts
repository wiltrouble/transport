import { Query } from "appwrite";
import { Channel, type RealtimeResponseEvent } from "appwrite";
import { getRealtime, getTablesDB } from "@/lib/appwrite";
import { mapGpsTracking } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import { gpsTrackingService } from "@/services/gpsTrackingService";
import { parentStudentService } from "@/services/parentStudentService";
import { sessionStudentService } from "@/services/sessionStudentService";
import { transportSessionService } from "@/services/transportSessionService";
import type { GpsTrackingPoint, ParentLiveTracking, SessionStudent, TransportSession } from "@school/types";

function isGpsRowEvent(events: string[]): boolean {
  return events.some((e) => e.includes(".create") || e.includes(".update"));
}

export const trackingService = {
  async getActiveSessionsForParent(parentId: string): Promise<TransportSession[]> {
    const studentIds = await parentStudentService.getStudentIdsForParent(parentId);
    if (studentIds.length === 0) return [];

    const tablesDB = getTablesDB();
    const { databaseId, transportSessionsTableId } = getTablesConfig();

    let sessionRows: AppwriteRow[];
    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: transportSessionsTableId,
        queries: [Query.equal("status", "active"), Query.limit(50)],
      });
      sessionRows = result.rows as AppwriteRow[];
    } catch {
      const all = await tablesDB.listRows({
        databaseId,
        tableId: transportSessionsTableId,
        queries: [Query.limit(100)],
      });
      sessionRows = (all.rows as AppwriteRow[]).filter((r) => String(r.status) === "active");
    }

    const activeForParent: TransportSession[] = [];
    for (const row of sessionRows) {
      const session = await transportSessionService.getById(row.$id);
      if (!session || session.status !== "active") continue;
      const students = await sessionStudentService.getSessionStudents(session.id);
      if (students.some((s) => studentIds.includes(s.studentId))) {
        activeForParent.push(session);
      }
    }
    return activeForParent;
  },

  async getActiveChildSession(
    parentId: string,
    preferredStudentId?: string,
  ): Promise<{ session: TransportSession; sessionStudent: SessionStudent | null } | null> {
    const sessions = await this.getActiveSessionsForParent(parentId);
    if (sessions.length === 0) return null;

    let session = sessions[0];
    if (preferredStudentId) {
      for (const s of sessions) {
        const students = await sessionStudentService.getSessionStudents(s.id);
        if (students.some((ss) => ss.studentId === preferredStudentId)) {
          session = s;
          break;
        }
      }
    }

    const sessionStudents = await sessionStudentService.getSessionStudents(session.id);
    const studentIds = await parentStudentService.getStudentIdsForParent(parentId);
    const sessionStudent =
      sessionStudents.find((ss) =>
        preferredStudentId
          ? ss.studentId === preferredStudentId
          : studentIds.includes(ss.studentId),
      ) ?? sessionStudents[0] ?? null;

    return { session, sessionStudent };
  },

  async getLatestGpsForSession(sessionId: string): Promise<GpsTrackingPoint | null> {
    return gpsTrackingService.getLatestForSession(sessionId);
  },

  async buildLiveTracking(
    parentId: string,
    preferredStudentId?: string,
  ): Promise<ParentLiveTracking | null> {
    const active = await this.getActiveChildSession(parentId, preferredStudentId);
    if (!active) return null;

    const latestPoint = await this.getLatestGpsForSession(active.session.id);
    return {
      session: active.session,
      sessionStudent: active.sessionStudent,
      student: active.sessionStudent?.student ?? null,
      latestPoint,
      connected: false,
    };
  },

  async subscribeToGpsUpdates(
    transportSessionId: string,
    onPoint: (point: GpsTrackingPoint) => void,
  ) {
    const { databaseId, gpsTrackingTableId } = getTablesConfig();
    const realtime = getRealtime();
    const channel = Channel.tablesdb(databaseId).table(gpsTrackingTableId).row();

    const subscription = await realtime.subscribe(
      channel,
      (response: RealtimeResponseEvent<AppwriteRow>) => {
        if (!isGpsRowEvent(response.events)) return;
        const payload = response.payload;
        if (!payload || typeof payload !== "object") return;
        const point = mapGpsTracking(payload);
        if (point.transportSessionId === transportSessionId) {
          onPoint(point);
        }
      },
    );

    return subscription;
  },
};
