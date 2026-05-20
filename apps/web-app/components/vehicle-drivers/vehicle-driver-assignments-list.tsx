"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { unassignVehicleDriverAction } from "@/app/actions/vehicle-drivers";
import { AssignmentStatusBadge } from "@/components/vehicle-drivers/assignment-status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@school/utils";
import {
  isActiveVehicleDriverAssignment,
  type VehicleDriverAssignment,
} from "@school/types";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<VehicleDriverAssignment | null>(null);

  async function confirmUnassign() {
    if (!unassignTarget) return;
    setLoading(true);
    const res = await unassignVehicleDriverAction({
      assignmentId: unassignTarget.id,
      vehicleId: unassignTarget.vehicleId,
      driverId: unassignTarget.driverId,
    });
    setLoading(false);
    setUnassignTarget(null);
    if (!res.ok) {
      toast.error(typeof res.error === "string" ? res.error : "No se pudo finalizar");
      return;
    }
    toast.success("Asignación finalizada");
    router.refresh();
  }

  if (assignments.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
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
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (row: VehicleDriverAssignment) =>
              isActiveVehicleDriverAssignment(row) ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm text-red-600 hover:text-red-700"
                    disabled={loading}
                    onClick={() => setUnassignTarget(row)}
                  >
                    Finalizar
                  </Button>
                </div>
              ) : null,
          },
        ]}
        data={assignments}
        keyExtractor={(r) => r.id}
        emptyMessage={emptyTitle}
      />

      <ConfirmDialog
        open={Boolean(unassignTarget)}
        title="Finalizar asignación"
        description="El registro se conservará en el historial con fecha de finalización. ¿Continuar?"
        confirmLabel="Finalizar"
        variant="danger"
        loading={loading}
        onConfirm={() => void confirmUnassign()}
        onCancel={() => setUnassignTarget(null)}
      />
    </>
  );
}
