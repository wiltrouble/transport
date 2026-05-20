import { ActivityIndicator, Text, View } from "react-native";
import { TRACKING_INTERVAL_MS } from "@school/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGpsTracking } from "@/hooks/use-gps-tracking";

type GpsTrackingPanelProps = {
  compact?: boolean;
};

export function GpsTrackingPanel({ compact = false }: GpsTrackingPanelProps) {
  const {
    canTrack,
    isTracking,
    isStarting,
    permissionGranted,
    currentLocation,
    lastSentAt,
    error,
    sending,
    startTracking,
    stopTracking,
  } = useGpsTracking();

  const intervalSec = TRACKING_INTERVAL_MS / 1000;
  const gpsStatusLabel = isTracking
    ? "Rastreando"
    : canTrack
      ? "Listo"
      : "Sesión no activa";
  const gpsTone = isTracking ? "success" : canTrack ? "info" : "default";

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-slate-500">Rastreo GPS</Text>
        <Badge label={gpsStatusLabel} tone={gpsTone} />
      </View>

      {!compact ? (
        <Text className="mt-1 text-xs text-slate-500">
          Primer plano · cada {intervalSec}s
        </Text>
      ) : null}

      {error ? (
        <Text className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </Text>
      ) : null}

      {permissionGranted === false ? (
        <Text className="mt-2 text-sm text-amber-700">
          Active el permiso de ubicación para rastrear la ruta.
        </Text>
      ) : null}

      {currentLocation ? (
        <View className="mt-3 gap-1">
          <Text className="font-mono text-sm text-slate-900">
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text className="text-sm text-slate-600">
            Velocidad: {(currentLocation.speed * 3.6).toFixed(1)} km/h
          </Text>
          {lastSentAt ? (
            <Text className="text-xs text-slate-400">
              Último envío: {new Date(lastSentAt).toLocaleTimeString()}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text className="mt-2 text-sm text-slate-500">Sin lectura GPS aún.</Text>
      )}

      {sending ? (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#2563eb" />
          <Text className="text-sm text-slate-600">Enviando ubicación…</Text>
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        {!isTracking ? (
          <Button
            label={isStarting ? "Iniciando…" : "Iniciar rastreo"}
            onPress={startTracking}
            disabled={!canTrack || sending || isStarting}
            loading={sending || isStarting}
          />
        ) : (
          <Button label="Detener rastreo" variant="danger" onPress={stopTracking} />
        )}
      </View>
    </Card>
  );
}
