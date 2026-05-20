import { ID, Query } from "appwrite";
import { parseUnknownAttributeName } from "@school/utils";
import { getTablesDB } from "@/lib/appwrite";
import { formatAppwriteError } from "@/lib/appwrite-errors";
import {
  GPS_DRIVER_COL,
  GPS_SESSION_COL,
  GPS_VEHICLE_COL,
  readDriverIdFromGpsRow,
  resolveGpsDriverId,
  resolveGpsVehicleId,
} from "@/lib/gps-relations";
import { mapGpsTracking } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import { transportSessionService } from "@/services/transportSessionService";
import type { Driver, GpsTrackingPoint, TransportSession } from "@school/types";
import type { DeviceLocation } from "@/services/locationService";

export type SendLocationInput = {
  transportSessionId: string;
  vehicleId: string;
  /** drivers table row $id */
  driverId: string;
  location: DeviceLocation;
};

type ResolvedGpsIds = {
  transportSessionId: string;
  vehicleId: string;
  driverId: string;
};

function assertNonEmptyId(label: string, value: string): string {
  const id = value.trim();
  if (!id) {
    throw new Error(`${label} es obligatorio para guardar el punto GPS.`);
  }
  return id;
}

export function resolveGpsIdsForSend(
  input: SendLocationInput,
  session: TransportSession,
  driver: Driver,
): ResolvedGpsIds {
  return {
    transportSessionId: assertNonEmptyId(
      "transportSessionId",
      input.transportSessionId || session.id,
    ),
    vehicleId: assertNonEmptyId(
      "vehicleId",
      resolveGpsVehicleId(session, input.vehicleId),
    ),
    driverId: assertNonEmptyId("driverId", resolveGpsDriverId(session, driver)),
  };
}

function buildGpsRowData(
  ids: ResolvedGpsIds,
  location: DeviceLocation,
  includeTrackedAt: boolean,
): Record<string, string | number> {
  const data: Record<string, string | number> = {
    [GPS_SESSION_COL]: ids.transportSessionId,
    [GPS_VEHICLE_COL]: ids.vehicleId,
    [GPS_DRIVER_COL]: ids.driverId,
    latitude: location.latitude,
    longitude: location.longitude,
    speed: Math.round(location.speed * 100) / 100,
    heading: Math.round(location.heading * 100) / 100,
    accuracy: Math.round(location.accuracy * 100) / 100,
  };

  if (includeTrackedAt) {
    data.trackedAt = new Date().toISOString();
  }

  return data;
}

function assertDriverSaved(row: AppwriteRow, expectedDriverId: string): GpsTrackingPoint {
  const point = mapGpsTracking(row);
  const savedDriverId = readDriverIdFromGpsRow(row) || point.driverId;

  if (!savedDriverId) {
    throw new Error(
      `El punto GPS se guardó sin ${GPS_DRIVER_COL}. ` +
        `Revise que la columna sea relación → drivers y que el rol del conductor tenga permiso de crear en gps_tracking.`,
    );
  }

  if (savedDriverId !== expectedDriverId) {
    throw new Error(
      `El conductor guardado (${savedDriverId}) no coincide con el esperado (${expectedDriverId}).`,
    );
  }

  return { ...point, driverId: savedDriverId };
}

function unknownAttributeHint(attribute: string): string {
  const colToEnv: Record<string, string> = {
    [GPS_SESSION_COL]: "EXPO_PUBLIC_APPWRITE_GT_SESSION_REL",
    [GPS_VEHICLE_COL]: "EXPO_PUBLIC_APPWRITE_GT_VEHICLE_REL",
    [GPS_DRIVER_COL]: "EXPO_PUBLIC_APPWRITE_GT_DRIVER_REL",
    trackedAt: "columna trackedAt (datetime) en gps_tracking",
  };
  const env = colToEnv[attribute] ?? "EXPO_PUBLIC_APPWRITE_GT_*_REL";
  return (
    `La tabla gps_tracking no tiene una columna con Key "${attribute}". ` +
    `Configure ${env} con el Key exacto de Appwrite.`
  );
}

export const gpsTrackingService = {
  async validateTrackingSession(sessionId: string): Promise<TransportSession> {
    const session = await transportSessionService.getById(sessionId);
    if (!session) {
      throw new Error("Sesión no encontrada.");
    }
    if (session.status !== "active") {
      throw new Error(
        `La sesión está en estado "${session.status}". Inicie la sesión en la pestaña Sesión antes de rastrear GPS.`,
      );
    }
    return session;
  },

  /** Persists one GPS row in the `gps_tracking` table. */
  async saveLocation(
    input: SendLocationInput,
    driver: Driver,
  ): Promise<GpsTrackingPoint> {
    return this.sendLocation(input, driver);
  },

  async sendLocation(
    input: SendLocationInput,
    driver: Driver,
  ): Promise<GpsTrackingPoint> {
    const session = await this.validateTrackingSession(input.transportSessionId);
    const ids = resolveGpsIdsForSend(input, session, driver);

    const tablesDB = getTablesDB();
    const { databaseId, gpsTrackingTableId } = getTablesConfig();

    const create = (includeTrackedAt: boolean) =>
      tablesDB.createRow({
        databaseId,
        tableId: gpsTrackingTableId,
        rowId: ID.unique(),
        data: buildGpsRowData(ids, input.location, includeTrackedAt),
      });

    try {
      const row = await create(true);
      return assertDriverSaved(row as AppwriteRow, ids.driverId);
    } catch (error) {
      const unknown = parseUnknownAttributeName(error);

      if (unknown === "trackedAt") {
        try {
          const row = await create(false);
          return assertDriverSaved(row as AppwriteRow, ids.driverId);
        } catch (retryError) {
          const retryUnknown = parseUnknownAttributeName(retryError);
          if (retryUnknown) {
            throw new Error(unknownAttributeHint(retryUnknown));
          }
          throw new Error(formatAppwriteError(retryError));
        }
      }

      if (unknown) {
        throw new Error(unknownAttributeHint(unknown));
      }

      if (isSchemaAttributeError(error)) {
        throw new Error(formatAppwriteError(error));
      }

      throw new Error(formatAppwriteError(error));
    }
  },

  async getLatestForSession(sessionId: string): Promise<GpsTrackingPoint | null> {
    const tablesDB = getTablesDB();
    const { databaseId, gpsTrackingTableId } = getTablesConfig();

    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: gpsTrackingTableId,
        queries: [
          Query.equal(GPS_SESSION_COL, sessionId),
          Query.orderDesc("trackedAt"),
          Query.limit(1),
        ],
      });
      if (result.rows.length > 0) {
        return mapGpsTracking(result.rows[0] as AppwriteRow);
      }
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
    }

    const all = await tablesDB.listRows({
      databaseId,
      tableId: gpsTrackingTableId,
      queries: [Query.limit(200), Query.orderDesc("$createdAt")],
    });

    const match = (all.rows as AppwriteRow[])
      .map(mapGpsTracking)
      .filter((p) => p.transportSessionId === sessionId)
      .sort((a, b) => new Date(b.trackedAt).getTime() - new Date(a.trackedAt).getTime());

    return match[0] ?? null;
  },
};
