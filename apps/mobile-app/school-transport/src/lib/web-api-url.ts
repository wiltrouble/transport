import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_PORT = process.env.EXPO_PUBLIC_WEB_API_PORT?.trim() || "3000";

function getMetroHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGo?: { debuggerHost?: string } }).expoGo?.debuggerHost;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0]?.trim();
  return host || null;
}

function rewriteLocalhostForDevice(hostname: string, port: string): string {
  if (Platform.OS === "android" && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return `http://10.0.2.2:${port}`;
  }

  const metroHost = getMetroHost();
  if (
    (hostname === "localhost" || hostname === "127.0.0.1") &&
    metroHost &&
    metroHost !== "localhost" &&
    metroHost !== "127.0.0.1"
  ) {
    return `http://${metroHost}:${port}`;
  }

  return `http://${hostname}:${port}`;
}

/**
 * Base URL for Next.js API routes from the mobile app.
 * In dev, rewrites localhost to the device-reachable host (LAN IP or 10.0.2.2).
 */
export function resolveWebApiBaseUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_WEB_API_URL?.trim().replace(/\/$/, "");

  if (configured) {
    try {
      const url = new URL(configured);
      const port = url.port || DEFAULT_PORT;
      const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (__DEV__ && isLocal) {
        return rewriteLocalhostForDevice(url.hostname, port);
      }
      return configured;
    } catch {
      return configured;
    }
  }

  if (!__DEV__) return null;

  const metroHost = getMetroHost();
  if (metroHost) {
    if (Platform.OS === "android" && (metroHost === "localhost" || metroHost === "127.0.0.1")) {
      return `http://10.0.2.2:${DEFAULT_PORT}`;
    }
    return `http://${metroHost}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
}
