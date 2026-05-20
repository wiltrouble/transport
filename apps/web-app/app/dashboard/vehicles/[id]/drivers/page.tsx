import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleDriverAssignmentsList } from "@/components/vehicle-drivers/vehicle-driver-assignments-list";
import { AssignmentStatusBadge } from "@/components/vehicle-drivers/assignment-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@school/utils";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import { vehicleService } from "@/services/vehicleService";

type Props = { params: Promise<{ id: string }> };

export default async function VehicleDriversPage({ params }: Props) {
  const { id } = await params;
  const [vehicle, assignments, current] = await Promise.all([
    vehicleService.getById(id),
    vehicleDriverService.getVehicleDrivers(id),
    vehicleDriverService.getCurrentVehicleDriver(id),
  ]);
  if (!vehicle) notFound();

  return (
    <>
      <PageHeader
        title={`Conductores — ${vehicle.plate}`}
        description={`${vehicle.brand} ${vehicle.model}`}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: vehicle.plate, href: `/dashboard/vehicles/${id}` },
          { label: "Conductores" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/vehicles/${id}/edit`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Reemplazar conductor
            </Link>
            <Link
              href={`/dashboard/vehicles/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Volver al vehículo
            </Link>
          </div>
        }
      />

      {current?.driver ? (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Conductor activo</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Conductor</p>
              <Link
                href={`/dashboard/drivers/${current.driverId}`}
                className="mt-1 block font-medium text-indigo-600 hover:underline"
              >
                {current.driver.fullName}
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Licencia</p>
              <p className="mt-1 text-slate-900">{current.driver.licenseNumber}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Asignado desde</p>
              <p className="mt-1 text-slate-900">{formatDateTime(current.assignedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
              <div className="mt-1">
                <AssignmentStatusBadge assignment={current} />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Cada vehículo tiene un solo conductor activo. Use editar vehículo para reemplazarlo;
            el historial se conserva abajo.
          </p>
        </Card>
      ) : (
        <Card className="mb-8">
          <p className="text-sm text-amber-700">
            Sin conductor activo.{" "}
            <Link
              href={`/dashboard/vehicles/${id}/edit`}
              className="font-medium text-indigo-600 hover:underline"
            >
              Asigne uno al editar el vehículo
            </Link>
            .
          </p>
        </Card>
      )}

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial de asignaciones</h2>
      <VehicleDriverAssignmentsList
        assignments={assignments}
        showDriver
        emptyTitle="Sin historial de conductores"
        emptyDescription="Las asignaciones aparecerán al crear o reemplazar conductores."
      />
    </>
  );
}
