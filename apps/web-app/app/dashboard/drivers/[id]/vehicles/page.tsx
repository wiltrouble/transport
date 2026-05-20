import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleDriverAssignmentsList } from "@/components/vehicle-drivers/vehicle-driver-assignments-list";
import { AssignmentStatusBadge } from "@/components/vehicle-drivers/assignment-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@school/utils";
import { driverService } from "@/services/driverService";
import { vehicleDriverService } from "@/services/vehicleDriverService";

type Props = { params: Promise<{ id: string }> };

export default async function DriverVehiclesPage({ params }: Props) {
  const { id } = await params;
  const [driver, assignments, current] = await Promise.all([
    driverService.getById(id),
    vehicleDriverService.getDriverVehicles(id),
    vehicleDriverService.getDriverCurrentVehicle(id),
  ]);
  if (!driver) notFound();

  const currentVehicle = current?.vehicle;

  return (
    <>
      <PageHeader
        title={`Vehículos — ${driver.fullName}`}
        description={driver.licenseNumber}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Conductores", href: "/dashboard/drivers" },
          { label: driver.fullName, href: `/dashboard/drivers/${id}` },
          { label: "Vehículos" },
        ]}
        actions={
          <Link
            href={`/dashboard/drivers/${id}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Volver al conductor
          </Link>
        }
      />

      {current && currentVehicle ? (
        <Card className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Vehículo activo</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Placa</p>
              <Link
                href={`/dashboard/vehicles/${current.vehicleId}`}
                className="mt-1 block font-medium text-indigo-600 hover:underline"
              >
                {currentVehicle.plate}
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Marca / modelo</p>
              <p className="mt-1 text-slate-900">
                {currentVehicle.brand} {currentVehicle.model}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Editar asignación</p>
              <Link
                href={`/dashboard/vehicles/${current.vehicleId}/edit`}
                className="mt-1 block text-sm font-medium text-indigo-600 hover:underline"
              >
                Reemplazar conductor
              </Link>
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
            Un conductor solo puede operar un vehículo activo. Para reasignar, edite el vehículo
            correspondiente.
          </p>
        </Card>
      ) : (
        <Card className="mb-8">
          <p className="text-sm text-slate-600">
            Sin vehículo activo. Asigne este conductor al crear o editar un vehículo en{" "}
            <Link href="/dashboard/vehicles/create" className="font-medium text-indigo-600 hover:underline">
              Nuevo vehículo
            </Link>
            .
          </p>
        </Card>
      )}

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial de asignaciones</h2>
      <VehicleDriverAssignmentsList
        assignments={assignments}
        showVehicle
        showDriver={false}
        emptyTitle="Sin vehículos asignados"
        emptyDescription="El historial aparecerá cuando se asigne este conductor a un vehículo."
      />
    </>
  );
}
