import { useCallback, useEffect } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { ParentTrackingMap } from "@/components/parent/parent-tracking-map";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuthStore } from "@/store/auth-store";
import { useParentStore } from "@/store/parent-store";
import { useParentTrackingStore } from "@/store/parent-tracking-store";

export default function ParentTrackingScreen() {
  const parent = useAuthStore((s) => s.parent);
  const childrenOverviews = useParentStore((s) => s.childrenOverviews);
  const live = useParentTrackingStore((s) => s.live);
  const isLoading = useParentTrackingStore((s) => s.isLoading);
  const error = useParentTrackingStore((s) => s.error);
  const loadTracking = useParentTrackingStore((s) => s.loadTracking);
  const selectedStudentId = useParentTrackingStore((s) => s.selectedStudentId);

  const activeChild = childrenOverviews.find((c) => c.transportStatus === "active");
  const studentId = selectedStudentId ?? activeChild?.student.id;

  const refresh = useCallback(() => {
    if (!parent) return;
    void loadTracking(parent.id, studentId);
  }, [parent, studentId, loadTracking]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!activeChild && !live) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title="Rastreo en vivo" subtitle="Ubicación del vehículo escolar" />
        <View className="flex-1 px-4 pt-4">
          <EmptyState
            title="Sin transporte activo"
            description="Cuando su hijo tenga una sesión activa, verá el vehículo en el mapa en tiempo real."
          />
        </View>
      </View>
    );
  }

  const point = live?.latestPoint ?? null;
  const session = live?.session;
  const driver = session?.driver;
  const vehicle = session?.vehicle;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Rastreo en vivo" subtitle="Mapa en tiempo real · Appwrite Realtime" />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#2563eb" />
        }
      >
        {error ? (
          <Text className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</Text>
        ) : null}

        <View className="flex-row items-center justify-between">
          <Badge
            label={live?.connected ? "GPS en vivo" : "Conectando GPS…"}
            tone={live?.connected ? "success" : "warning"}
          />
          {point ? (
            <Text className="text-xs text-slate-500">
              Actualizado {new Date(point.trackedAt).toLocaleTimeString()}
            </Text>
          ) : null}
        </View>

        <ParentTrackingMap point={point} vehiclePlate={vehicle?.plate ?? "Vehículo"} />

        <Card>
          <Text className="text-sm font-medium text-slate-500">Vehículo</Text>
          <Text className="mt-1 text-lg font-bold text-slate-900">{vehicle?.plate ?? "—"}</Text>
          <Text className="text-sm text-slate-600">
            {vehicle?.brand} {vehicle?.model}
          </Text>
        </Card>

        <Card>
          <Text className="text-sm font-medium text-slate-500">Conductor</Text>
          <Text className="mt-1 text-lg font-bold text-slate-900">{driver?.fullName ?? "—"}</Text>
          <Text className="text-sm text-slate-600">{driver?.phone ?? "—"}</Text>
        </Card>

        {point ? (
          <Card>
            <Text className="text-sm font-medium text-slate-500">Velocidad actual</Text>
            <Text className="mt-1 text-2xl font-bold text-slate-900">
              {(point.speed * 3.6).toFixed(1)} km/h
            </Text>
            <Text className="mt-1 text-xs text-slate-400">
              Precisión ~{point.accuracy.toFixed(0)} m
            </Text>
          </Card>
        ) : null}

        {live?.student ? (
          <Card>
            <Text className="text-sm font-medium text-slate-500">Estudiante en ruta</Text>
            <Text className="mt-1 font-semibold text-slate-900">{live.student.fullName}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}
