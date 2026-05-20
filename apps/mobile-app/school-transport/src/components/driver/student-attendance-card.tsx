import { Text, View } from "react-native";
import { SESSION_STUDENT_STATUS_LABELS } from "@school/utils";
import type { SessionStudent } from "@school/types";
import { isSessionEditable } from "@school/utils";
import type { TransportSessionStatus } from "@school/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  student: SessionStudent;
  sessionStatus: TransportSessionStatus | string;
  onBoarded: () => void;
  onDroppedOff: () => void;
  onAbsent: () => void;
  loadingId: string | null;
};

function statusTone(status: string) {
  if (status === "boarded") return "info" as const;
  if (status === "dropped_off") return "success" as const;
  if (status === "absent") return "danger" as const;
  return "default" as const;
}

export function StudentAttendanceCard({
  student,
  sessionStatus,
  onBoarded,
  onDroppedOff,
  onAbsent,
  loadingId,
}: Props) {
  const editable = isSessionEditable(sessionStatus) && sessionStatus === "active";
  const name = student.student?.fullName ?? "Estudiante";
  const grade = student.student?.grade ?? "—";
  const statusKey = String(student.status);
  const statusLabel =
    SESSION_STUDENT_STATUS_LABELS[
      statusKey as keyof typeof SESSION_STUDENT_STATUS_LABELS
    ] ?? statusKey;
  const busy = loadingId === student.id;

  return (
    <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-slate-900">{name}</Text>
          <Text className="mt-0.5 text-sm text-slate-500">Grado {grade}</Text>
        </View>
        <Badge label={`#${student.pickupOrder}`} tone="info" />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Badge label={statusLabel} tone={statusTone(statusKey)} />
        {!editable ? (
          <Text className="text-xs text-slate-400">Solo lectura</Text>
        ) : null}
      </View>

      {editable ? (
        <View className="mt-4 gap-2">
          <Button
            label="Marcar abordó"
            variant="primary"
            loading={busy}
            disabled={student.boarded || student.absent}
            onPress={onBoarded}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Entregado"
                variant="secondary"
                loading={busy}
                disabled={!student.boarded || student.droppedOff}
                onPress={onDroppedOff}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Ausente"
                variant="danger"
                loading={busy}
                disabled={student.boarded || student.droppedOff}
                onPress={onAbsent}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
