import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { isSessionEditable } from "@school/utils";
import { SESSION_SHIFT_LABELS } from "@school/utils";
import type { SessionShift } from "@school/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SessionStatusBadge } from "@/components/driver/session-status-badge";
import { GpsTrackingPanel } from "@/components/driver/gps-tracking-panel";
import { useDriverSession } from "@/hooks/use-driver-session";

export default function DriverSessionScreen() {
  const {
    activeSession,
    sessionStudents,
    loadingAction,
    error,
    startSession,
    completeSession,
    cancelSession,
    refreshOperationalData,
  } = useDriverSession();

  const onRefresh = useCallback(() => refreshOperationalData(), [refreshOperationalData]);

  const editable = activeSession ? isSessionEditable(activeSession.status) : false;
  const shiftLabel =
    activeSession?.shift &&
    SESSION_SHIFT_LABELS[activeSession.shift as SessionShift]
      ? SESSION_SHIFT_LABELS[activeSession.shift as SessionShift]
      : activeSession?.shift;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Sesión de transporte" subtitle="Iniciar, completar o cancelar viaje" />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={loadingAction === "session"}
            onRefresh={onRefresh}
            tintColor="#2563eb"
          />
        }
      >
        {error ? (
          <Text className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</Text>
        ) : null}

        {!activeSession ? (
          <EmptyState
            title="No hay sesión disponible"
            description="El administrador debe crear una sesión pendiente para su vehículo y fecha de hoy."
          />
        ) : (
          <>
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-slate-900">
                  {activeSession.sessionDate}
                </Text>
                <SessionStatusBadge status={activeSession.status} />
              </View>
              <Text className="mt-2 text-sm text-slate-600">Turno: {shiftLabel}</Text>
              <Text className="mt-1 text-sm text-slate-600">
                Vehículo: {activeSession.vehicle?.plate ?? "—"}
              </Text>
              {activeSession.startTime ? (
                <Text className="mt-1 text-xs text-slate-400">
                  Inicio: {new Date(activeSession.startTime).toLocaleTimeString()}
                </Text>
              ) : null}
            </Card>

            <Card>
              <Text className="mb-3 text-sm font-medium text-slate-500">
                Estudiantes ({sessionStudents.length})
              </Text>
              <View className="gap-2">
                {sessionStudents.map((s) => (
                  <View
                    key={s.id}
                    className="flex-row items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5"
                  >
                    <Text className="font-medium text-slate-800">
                      {s.student?.fullName ?? "Estudiante"}
                    </Text>
                    <Text className="text-xs font-semibold text-brand-600">
                      #{s.pickupOrder}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            {activeSession.status === "active" ? <GpsTrackingPanel compact /> : null}

            {editable ? (
              <View className="gap-3">
                {activeSession.status === "pending" ? (
                  <Button
                    label="Iniciar sesión"
                    loading={loadingAction === "session"}
                    onPress={startSession}
                  />
                ) : null}
                {activeSession.status === "active" ? (
                  <Button
                    label="Completar sesión"
                    loading={loadingAction === "session"}
                    onPress={completeSession}
                  />
                ) : null}
                {activeSession.status === "pending" || activeSession.status === "active" ? (
                  <Button
                    label="Cancelar sesión"
                    variant="danger"
                    loading={loadingAction === "session"}
                    onPress={cancelSession}
                  />
                ) : null}
              </View>
            ) : (
              <EmptyState
                title="Sesión finalizada"
                description="Las sesiones completadas o canceladas son de solo lectura."
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
