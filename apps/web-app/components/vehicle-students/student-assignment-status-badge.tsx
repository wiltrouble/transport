import { Badge } from "@/components/ui/badge";
import { isActiveVehicleStudentAssignment } from "@school/types";
import type { VehicleStudentAssignment } from "@school/types";

export function StudentAssignmentStatusBadge({
  assignment,
}: {
  assignment: Pick<VehicleStudentAssignment, "status">;
}) {
  const active = isActiveVehicleStudentAssignment(assignment);
  return (
    <Badge variant={active ? "success" : "default"}>
      {active ? "Activa" : "Inactiva"}
    </Badge>
  );
}
