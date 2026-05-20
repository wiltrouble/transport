import { Badge } from "@/components/ui/badge";
import {
  SESSION_STUDENT_STATUS_LABELS,
  type SessionStudentStatus,
} from "@school/utils";

const VARIANTS: Record<SessionStudentStatus, "default" | "success" | "warning" | "danger"> = {
  pending: "warning",
  boarded: "success",
  dropped_off: "default",
  absent: "danger",
};

export function StudentSessionStatusBadge({ status }: { status: SessionStudentStatus | string }) {
  const key = status as SessionStudentStatus;
  const label = SESSION_STUDENT_STATUS_LABELS[key] ?? status;
  return <Badge variant={VARIANTS[key] ?? "default"}>{label}</Badge>;
}
