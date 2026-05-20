import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleDriverAssignmentsList } from "@/components/vehicle-drivers/vehicle-driver-assignments-list";
import { AssignmentStatusBadge } from "@/components/vehicle-drivers/assignment-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@school/utils";
import { driverService } from "@/services/driverService";
import { vehicleDriverService } from "@/services/vehicleDriverService";

type Props = { params: Promise<{ id: string }> };

export default async function DriverDetailPage({ params }: Props) {
  const { id } = await params;
  const [driver, currentAssignment, assignmentHistory] = await Promise.all([
    driverService.getById(id),
    vehicleDriverService.getDriverCurrentVehicle(id),
    vehicleDriverService.getDriverVehicles(id),
  ]);
  if (!driver) notFound();

  const currentVehicle = currentAssignment?.vehicle;

  return (
    <>
      <PageHeader
        title={driver.fullName}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Conductores", href: "/dashboard/drivers" },
          { label: driver.fullName },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/drivers/${id}/vehicles`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Historial de vehículos
            </Link>
            <Link
              href={`/dashboard/drivers/${id}/edit`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Editar
            </Link>
          </div>
        }
      />

      <Card className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Correo</p>
          <p className="mt-1 text-slate-900">{driver.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Teléfono</p>
          <p className="mt-1 text-slate-900">{driver.phone}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Licencia</p>
          <p className="mt-1 text-slate-900">
            {driver.licenseNumber} ({driver.licenseCategory})
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Vencimiento</p>
          <p className="mt-1 text-slate-900">{formatDate(driver.licenseExpiration)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
          <div className="mt-1">
            <StatusBadge status={driver.status} />
          </div>
        </div>
      </Card>

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Vehículo asignado</h2>
        {currentAssignment && currentVehicle ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Vehículo</p>
              <Link
                href={`/dashboard/vehicles/${currentAssignment.vehicleId}`}
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
              <p className="text-xs font-medium uppercase text-slate-500">Asignado desde</p>
              <p className="mt-1 text-slate-900">{formatDateTime(currentAssignment.assignedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Estado asignación</p>
              <div className="mt-1">
                <AssignmentStatusBadge assignment={currentAssignment} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Este conductor no tiene un vehículo activo asignado.
          </p>
        )}
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial de vehículos</h2>
      <div className="mb-6">
        <VehicleDriverAssignmentsList
          assignments={assignmentHistory}
          showVehicle
          showDriver={false}
          emptyTitle="Sin historial de vehículos"
          emptyDescription="Las asignaciones aparecerán al vincular este conductor con un vehículo."
        />
      </div>
    </>
  );
}
