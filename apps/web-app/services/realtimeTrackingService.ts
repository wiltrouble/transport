"use client";

import { Channel, Realtime, type RealtimeResponseEvent } from "appwrite";
import { getBrowserAppwriteClient } from "@/lib/appwrite";
import { mapGpsTracking } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { GpsTrackingPoint } from "@school/types";

export type GpsRealtimeHandler = (point: GpsTrackingPoint, event: string[]) => void;

function isRowCreateOrUpdate(events: string[]): boolean {
  return events.some(
    (e) =>
      e.includes(".create") ||
      e.includes(".update") ||
      (e.includes("rows") && (e.includes("create") || e.includes("update"))),
  );
}

export const realtimeTrackingService = {
  async subscribeToGpsTracking(onPoint: GpsRealtimeHandler) {
    const { databaseId, gpsTrackingTableId } = getTablesConfig();
    const client = getBrowserAppwriteClient();
    const realtime = new Realtime(client);

    const channel = Channel.tablesdb(databaseId).table(gpsTrackingTableId).row();

    const subscription = await realtime.subscribe(
      channel,
      (response: RealtimeResponseEvent<AppwriteRow>) => {
        if (!isRowCreateOrUpdate(response.events)) return;
        const payload = response.payload;
        if (!payload || typeof payload !== "object") return;
        onPoint(mapGpsTracking(payload), response.events);
      },
    );

    return subscription;
  },

  async disconnect() {
    const client = getBrowserAppwriteClient();
    const realtime = new Realtime(client);
    await realtime.disconnect();
  },
};
