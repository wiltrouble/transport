import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StudentAttendanceCard } from "@/components/driver/student-attendance-card";
import { useDriverSession } from "@/hooks/use-driver-session";

export default function DriverAttendanceScreen() {
  const {
    activeSession,
    sessionStudents,
    loadingAction,
    error,
    markBoarded,
    markDroppedOff,
    markAbsent,
    refreshOperationalData,
  } = useDriverSession();

  const onRefresh = useCallback(() => refreshOperationalData(), [refreshOperationalData]);

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Asistencia"
        subtitle={
          activeSession?.status === "active"
            ? "Los cambios se guardan al instante"
            : "Active la sesión para registrar asistencia"
        }
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        stickyHeaderIndices={[]}
      >
        {error ? (
          <Text className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</Text>
        ) : null}

        {!activeSession ? (
          <EmptyState
            title="Sin sesión activa"
            description="Inicie una sesión desde la pestaña Sesión para registrar asistencia."
          />
        ) : sessionStudents.length === 0 ? (
          <EmptyState
            title="Sin estudiantes en ruta"
            description="No hay estudiantes cargados en esta sesión."
          />
        ) : (
          sessionStudents.map((student) => (
            <StudentAttendanceCard
              key={student.id}
              student={student}
              sessionStatus={activeSession.status}
              loadingId={loadingAction}
              onBoarded={() => markBoarded(student.id)}
              onDroppedOff={() => markDroppedOff(student.id)}
              onAbsent={() => markAbsent(student.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
