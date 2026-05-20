import { TRANSPORT_SESSION_STATUS_LABELS } from "@school/utils";
import type { TransportSessionStatus } from "@school/types";
import { Badge } from "@/components/ui/badge";

const toneMap = {
  pending: "warning",
  active: "info",
  completed: "success",
  cancelled: "danger",
} as const;

export function SessionStatusBadge({ status }: { status: TransportSessionStatus | string }) {
  const key = status as TransportSessionStatus;
  const label = TRANSPORT_SESSION_STATUS_LABELS[key] ?? status;
  const tone = toneMap[key] ?? "default";

  return <Badge label={label} tone={tone} />;
}
