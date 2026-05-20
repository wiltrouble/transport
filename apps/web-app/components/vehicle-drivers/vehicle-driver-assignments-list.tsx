import Link from "next/link";
import { AssignmentStatusBadge } from "@/components/vehicle-drivers/assignment-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@school/utils";
import type { VehicleDriverAssignment } from "@school/types";

/**
 * Read-only history of `vehicle_drivers` rows. Driver replacement is handled
 * exclusively from the vehicle edit page; this list is purely informational.
 */
type VehicleDriverAssignmentsListProps = {
  assignments: VehicleDriverAssignment[];
  showVehicle?: boolean;
  showDriver?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function VehicleDriverAssignmentsList({
  assignments,
  showVehicle = false,
  showDriver = true,
  emptyTitle = "Sin asignaciones",
  emptyDescription,
}: VehicleDriverAssignmentsListProps) {
  if (assignments.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <DataTable
      columns={[
        ...(showVehicle
          ? [
              {
                key: "vehicle",
                header: "Vehículo",
                cell: (row: VehicleDriverAssignment) =>
                  row.vehicle ? (
                    <Link
                      href={`/dashboard/vehicles/${row.vehicleId}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {row.vehicle.plate}
                    </Link>
                  ) : (
                    row.vehicleId
                  ),
              },
              {
                key: "model",
                header: "Marca / modelo",
                cell: (row: VehicleDriverAssignment) =>
                  row.vehicle ? `${row.vehicle.brand} ${row.vehicle.model}` : "—",
              },
            ]
          : []),
        ...(showDriver
          ? [
              {
                key: "driver",
                header: "Conductor",
                cell: (row: VehicleDriverAssignment) =>
                  row.driver ? (
                    <Link
                      href={`/dashboard/drivers/${row.driverId}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {row.driver.fullName}
                    </Link>
                  ) : (
                    row.driverId
                  ),
              },
              {
                key: "phone",
                header: "Teléfono",
                cell: (row: VehicleDriverAssignment) => row.driver?.phone ?? "—",
              },
              {
                key: "license",
                header: "Licencia",
                cell: (row: VehicleDriverAssignment) => row.driver?.licenseNumber ?? "—",
              },
            ]
          : []),
        {
          key: "assigned",
          header: "Asignado",
          cell: (row: VehicleDriverAssignment) => formatDateTime(row.assignedAt),
        },
        {
          key: "unassigned",
          header: "Finalizado",
          cell: (row: VehicleDriverAssignment) => formatDateTime(row.unassignedAt),
        },
        {
          key: "status",
          header: "Estado",
          cell: (row: VehicleDriverAssignment) => <AssignmentStatusBadge assignment={row} />,
        },
      ]}
      data={assignments}
      keyExtractor={(r) => r.id}
      emptyMessage={emptyTitle}
    />
  );
}
