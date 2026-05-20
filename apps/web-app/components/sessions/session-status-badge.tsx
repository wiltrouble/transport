import { Badge } from "@/components/ui/badge";
import {
  TRANSPORT_SESSION_STATUS_LABELS,
  type TransportSessionStatus,
} from "@school/utils";

const VARIANTS: Record<
  TransportSessionStatus,
  "default" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  active: "success",
  completed: "default",
  cancelled: "danger",
};

export function SessionStatusBadge({ status }: { status: TransportSessionStatus | string }) {
  const key = status as TransportSessionStatus;
  const label = TRANSPORT_SESSION_STATUS_LABELS[key] ?? status;
  return <Badge variant={VARIANTS[key] ?? "default"}>{label}</Badge>;
}
