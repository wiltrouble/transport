import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { GpsTrackingPanel } from "@/components/driver/gps-tracking-panel";
import { useGpsTracking } from "@/hooks/use-gps-tracking";

export default function DriverTrackingScreen() {
  const { driver, vehicle, activeSession, refreshOperationalData } = useGpsTracking();

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Rastreo GPS"
        subtitle="Ubicación en primer plano · envío automático a operaciones"
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshOperationalData} />
        }
      >
        <Card>
          <Text className="text-sm font-medium text-slate-500">Sesión activa</Text>
          {activeSession ? (
            <View className="mt-2 gap-1">
              <Text className="text-lg font-semibold text-slate-900">
                {activeSession.sessionDate} · {activeSession.shift}
              </Text>
              <Text className="text-sm text-slate-600">Estado: {activeSession.status}</Text>
            </View>
          ) : (
            <EmptyState
              title="Sin sesión activa"
              description="Inicie la sesión de transporte antes de activar el GPS."
            />
          )}
        </Card>

        <Card>
          <Text className="text-sm font-medium text-slate-500">Vehículo</Text>
          <Text className="mt-1 text-lg font-semibold text-slate-900">
            {vehicle?.plate ?? "—"}
          </Text>
          <Text className="text-sm text-slate-600">{driver?.fullName ?? "Conductor"}</Text>
        </Card>

        <GpsTrackingPanel />
      </ScrollView>
    </View>
  );
}
