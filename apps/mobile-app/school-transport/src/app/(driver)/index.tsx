import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SESSION_SHIFT_LABELS } from "@school/utils";
import type { SessionShift } from "@school/types";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SessionStatusBadge } from "@/components/driver/session-status-badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function DriverDashboardScreen() {
  const router = useRouter();
  const driver = useAuthStore((s) => s.driver);
  const vehicle = useAuthStore((s) => s.vehicle);
  const activeSession = useAuthStore((s) => s.activeSession);
  const sessionStudents = useAuthStore((s) => s.sessionStudents);
  const refreshOperationalData = useAuthStore((s) => s.refreshOperationalData);
  const logout = useAuthStore((s) => s.logout);
  const isLoading = useAuthStore((s) => s.isLoading);

  const onRefresh = useCallback(() => refreshOperationalData(), [refreshOperationalData]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const shiftLabel =
    activeSession?.shift &&
    SESSION_SHIFT_LABELS[activeSession.shift as SessionShift]
      ? SESSION_SHIFT_LABELS[activeSession.shift as SessionShift]
      : activeSession?.shift;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title={`Hola, ${driver?.fullName?.split(" ")[0] ?? "Conductor"}`}
        subtitle="Panel operativo del día"
        right={
          <Pressable onPress={handleLogout} className="rounded-xl bg-slate-100 px-3 py-2">
            <Text className="text-sm font-medium text-slate-600">Salir</Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        <Card>
          <Text className="text-sm font-medium text-slate-500">Vehículo asignado</Text>
          {vehicle ? (
            <>
              <Text className="mt-1 text-xl font-bold text-slate-900">{vehicle.plate}</Text>
              <Text className="text-sm text-slate-600">
                {vehicle.brand} {vehicle.model} · {vehicle.capacity} pasajeros
              </Text>
            </>
          ) : (
            <Text className="mt-2 text-sm text-slate-600">
              Sin vehículo asignado. Contacte al administrador.
            </Text>
          )}
        </Card>

        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-slate-500">Sesión de hoy</Text>
            {activeSession ? <SessionStatusBadge status={activeSession.status} /> : null}
          </View>
          {activeSession ? (
            <View className="mt-3 gap-1">
              <Text className="text-lg font-semibold text-slate-900">
                {activeSession.sessionDate} · {shiftLabel}
              </Text>
              <Text className="text-sm text-slate-600">
                {sessionStudents.length} estudiantes en ruta
              </Text>
            </View>
          ) : (
            <View className="mt-3">
              <EmptyState
                title="Sin sesión programada"
                description="No hay viajes pendientes o activos para hoy."
              />
            </View>
          )}
        </Card>

        <Card>
          <Text className="mb-3 text-sm font-medium text-slate-500">Estudiantes asignados</Text>
          {sessionStudents.length === 0 ? (
            <EmptyState
              title="Sin estudiantes"
              description="Los estudiantes aparecerán cuando haya una sesión con ruta cargada."
            />
          ) : (
            <View className="gap-2">
              {sessionStudents.slice(0, 5).map((s) => (
                <View
                  key={s.id}
                  className="flex-row items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
                >
                  <Text className="font-medium text-slate-800">
                    {s.student?.fullName ?? "Estudiante"}
                  </Text>
                  <Text className="text-xs text-slate-500">Orden #{s.pickupOrder}</Text>
                </View>
              ))}
              {sessionStudents.length > 5 ? (
                <Text className="text-center text-xs text-slate-400">
                  +{sessionStudents.length - 5} más en asistencia
                </Text>
              ) : null}
            </View>
          )}
        </Card>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Gestionar sesión"
              variant="secondary"
              onPress={() => router.push("/(driver)/session")}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Asistencia"
              onPress={() => router.push("/(driver)/attendance")}
              disabled={!activeSession}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
