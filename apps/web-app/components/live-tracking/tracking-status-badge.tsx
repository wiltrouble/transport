import { VEHICLE_TRACKING_STATUS_LABELS } from "@school/utils";
import type { VehicleTrackingStatus } from "@school/types";
import { Badge } from "@/components/ui/badge";

const variantMap: Record<
  VehicleTrackingStatus,
  "default" | "success" | "warning" | "danger"
> = {
  online: "default",
  offline: "danger",
  tracking: "success",
  inactive: "warning",
};

export function TrackingStatusBadge({ status }: { status: VehicleTrackingStatus }) {
  return (
    <Badge variant={variantMap[status]}>{VEHICLE_TRACKING_STATUS_LABELS[status]}</Badge>
  );
}
