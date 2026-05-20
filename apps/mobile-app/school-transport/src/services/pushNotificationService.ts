import { ID, Query } from "appwrite";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getTablesDB } from "@/lib/appwrite";
import { mapPushToken } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import { PUSH_TOKEN_PARENT_COL, readParentIdFromPushTokenRow } from "@/lib/push-token-relations";
import { getTablesConfig } from "@/lib/tables-config";
import type { PushToken } from "@school/types";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null = null;
let notificationsUnavailable: string | null = null;
let handlerConfigured = false;

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export function getPushUnavailableReason(): string | null {
  return notificationsUnavailable;
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (notificationsUnavailable) return null;
  if (notificationsModule) return notificationsModule;

  if (isExpoGo()) {
    notificationsUnavailable =
      "Las notificaciones push no están disponibles en Expo Go. Use una development build.";
    return null;
  }

  try {
    const Notifications = await import("expo-notifications");
    if (!handlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
    notificationsModule = Notifications;
    return Notifications;
  } catch (error) {
    notificationsUnavailable =
      error instanceof Error ? error.message : "Notificaciones push no disponibles";
    return null;
  }
}

export const pushNotificationService = {
  async requestPermission(): Promise<boolean> {
    const Notifications = await loadNotifications();
    if (!Notifications || !Device.isDevice) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  },

  async getExpoPushToken(): Promise<string | null> {
    const Notifications = await loadNotifications();
    if (!Notifications || !Device.isDevice) return null;
    const granted = await this.requestPermission();
    if (!granted) return null;

    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
      process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  },

  async registerPushToken(parentId: string): Promise<PushToken | null> {
    const token = await this.getExpoPushToken();
    if (!token) return null;

    const tablesDB = getTablesDB();
    const { databaseId, pushTokensTableId } = getTablesConfig();
    const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "unknown";
    const deviceName = Device.modelName ?? Device.deviceName ?? "Unknown device";

    try {
      const existing = await tablesDB.listRows({
        databaseId,
        tableId: pushTokensTableId,
        queries: [
          Query.equal(PUSH_TOKEN_PARENT_COL, parentId),
          Query.equal("token", token),
          Query.limit(5),
        ],
      });

      if (existing.rows.length > 0) {
        const row = await tablesDB.updateRow({
          databaseId,
          tableId: pushTokensTableId,
          rowId: existing.rows[0].$id,
          data: { isActive: true, deviceName, platform },
        });
        return mapPushToken(row as AppwriteRow);
      }
    } catch {
      // fall through to create
    }

    const row = await tablesDB.createRow({
      databaseId,
      tableId: pushTokensTableId,
      rowId: ID.unique(),
      data: {
        [PUSH_TOKEN_PARENT_COL]: parentId,
        token,
        platform,
        deviceName,
        isActive: true,
      },
    });

    return mapPushToken(row as AppwriteRow);
  },

  async deactivateTokensForParent(parentId: string): Promise<void> {
    const tablesDB = getTablesDB();
    const { databaseId, pushTokensTableId } = getTablesConfig();

    let rows: AppwriteRow[];
    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: pushTokensTableId,
        queries: [Query.equal(PUSH_TOKEN_PARENT_COL, parentId), Query.limit(20)],
      });
      rows = result.rows as AppwriteRow[];
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) return;
      const all = await tablesDB.listRows({
        databaseId,
        tableId: pushTokensTableId,
        queries: [Query.limit(50)],
      });
      rows = (all.rows as AppwriteRow[]).filter(
        (r) => readParentIdFromPushTokenRow(r) === parentId,
      );
    }

    await Promise.all(
      rows.map((row) =>
        tablesDB.updateRow({
          databaseId,
          tableId: pushTokensTableId,
          rowId: row.$id,
          data: { isActive: false },
        }),
      ),
    );
  },
};
