import { Image, Text, View } from "react-native";
import type { ParentChildOverview } from "@school/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const statusLabels: Record<string, { label: string; tone: "default" | "success" | "warning" | "danger" | "info" }> = {
  no_session: { label: "Sin sesión", tone: "default" },
  pending: { label: "Pendiente", tone: "warning" },
  active: { label: "En ruta", tone: "success" },
  completed: { label: "Completado", tone: "info" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

const attendanceLabels: Record<string, string> = {
  pending: "Pendiente",
  boarded: "Abordó",
  dropped_off: "Dejó en destino",
  absent: "Ausente",
};

type ChildCardProps = {
  overview: ParentChildOverview;
};

export function ChildCard({ overview }: ChildCardProps) {
  const { student, session, sessionStudent, transportStatus } = overview;
  const transport = statusLabels[transportStatus] ?? statusLabels.no_session;
  const attendance =
    sessionStudent?.status && attendanceLabels[String(sessionStudent.status)]
      ? attendanceLabels[String(sessionStudent.status)]
      : sessionStudent?.absent
        ? "Ausente"
        : sessionStudent?.droppedOff
          ? "Dejó en destino"
          : sessionStudent?.boarded
            ? "Abordó"
            : "Pendiente";

  return (
    <Card>
      <View className="flex-row gap-3">
        {student.photo ? (
          <Image
            source={{ uri: student.photo }}
            className="size-14 rounded-2xl bg-slate-100"
          />
        ) : (
          <View className="size-14 items-center justify-center rounded-2xl bg-brand-100">
            <Text className="text-lg font-bold text-brand-700">
              {student.fullName.charAt(0)}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="text-base font-bold text-slate-900">{student.fullName}</Text>
            <Badge label={transport.label} tone={transport.tone} />
          </View>
          <Text className="text-sm text-slate-600">Grado: {student.grade || "—"}</Text>
          <Text className="mt-1 text-sm text-slate-600">Asistencia: {attendance}</Text>
          {session ? (
            <Text className="mt-1 text-xs text-slate-400">
              Sesión {session.sessionDate} · {session.shift}
            </Text>
          ) : null}
          {sessionStudent?.pickupTime ? (
            <Text className="text-xs text-slate-400">
              Abordó: {new Date(sessionStudent.pickupTime).toLocaleTimeString()}
            </Text>
          ) : null}
          {sessionStudent?.dropoffTime ? (
            <Text className="text-xs text-slate-400">
              Bajó: {new Date(sessionStudent.dropoffTime).toLocaleTimeString()}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
