import { Badge } from "@/components/ui/badge";
import { isActiveVehicleDriverAssignment } from "@school/types";
import type { VehicleDriverAssignment } from "@school/types";

export function AssignmentStatusBadge({
  assignment,
}: {
  assignment: Pick<VehicleDriverAssignment, "status" | "unassignedAt">;
}) {
  const active = isActiveVehicleDriverAssignment(assignment);
  return (
    <Badge variant={active ? "success" : "default"}>
      {active ? "Activa" : "Inactiva"}
    </Badge>
  );
}
