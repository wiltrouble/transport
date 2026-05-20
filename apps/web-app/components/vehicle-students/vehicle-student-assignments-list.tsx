"use client";

import Link from "next/link";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentAssignmentStatusBadge } from "@/components/vehicle-students/student-assignment-status-badge";
import type { VehicleStudentAssignment } from "@school/types";

type VehicleStudentAssignmentsListProps = {
  assignments: VehicleStudentAssignment[];
  showVehicle?: boolean;
  showStudent?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function VehicleStudentAssignmentsList({
  assignments,
  showVehicle = true,
  showStudent = false,
  emptyTitle = "Sin asignaciones",
  emptyDescription,
}: VehicleStudentAssignmentsListProps) {
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
                cell: (row: VehicleStudentAssignment) =>
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
                cell: (row: VehicleStudentAssignment) =>
                  row.vehicle ? `${row.vehicle.brand} ${row.vehicle.model}` : "—",
              },
            ]
          : []),
        ...(showStudent
          ? [
              {
                key: "student",
                header: "Estudiante",
                cell: (row: VehicleStudentAssignment) =>
                  row.student ? (
                    <Link
                      href={`/dashboard/students/${row.studentId}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {row.student.fullName}
                    </Link>
                  ) : (
                    row.studentId
                  ),
              },
              {
                key: "grade",
                header: "Grado",
                cell: (row: VehicleStudentAssignment) => row.student?.grade ?? "—",
              },
            ]
          : []),
        {
          key: "order",
          header: "Orden",
          cell: (row: VehicleStudentAssignment) => row.pickupOrder,
        },
        {
          key: "pickup",
          header: "Recogida",
          cell: (row: VehicleStudentAssignment) => row.pickupTime || "—",
        },
        {
          key: "dropoff",
          header: "Entrega",
          cell: (row: VehicleStudentAssignment) => row.dropoffTime || "—",
        },
        {
          key: "status",
          header: "Estado",
          cell: (row: VehicleStudentAssignment) => (
            <StudentAssignmentStatusBadge assignment={row} />
          ),
        },
      ]}
      data={assignments}
      keyExtractor={(r) => r.id}
      emptyMessage={emptyTitle}
    />
  );
}
