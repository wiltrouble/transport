import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleDriverAssignmentsList } from "@/components/vehicle-drivers/vehicle-driver-assignments-list";
import { AssignmentStatusBadge } from "@/components/vehicle-drivers/assignment-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StudentAssignmentStatusBadge } from "@/components/vehicle-students/student-assignment-status-badge";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { formatDateTime } from "@school/utils";
import { vehicleService } from "@/services/vehicleService";

type Props = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;
  const vehicle = await vehicleService.getByIdWithDetails(id);
  if (!vehicle) notFound();

  const current = vehicle.currentDriverAssignment;

  return (
    <>
      <PageHeader
        title={vehicle.plate}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: vehicle.plate },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/vehicles/${id}/students`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Gestionar estudiantes
            </Link>
            <Link
              href={`/dashboard/vehicles/${id}/edit`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Editar vehículo
            </Link>
          </div>
        }
      />

      <Card className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Vehículo</p>
          <p className="mt-1 font-medium text-slate-900">
            {vehicle.brand} {vehicle.model} ({vehicle.year})
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Capacidad</p>
          <p className="mt-1 text-slate-900">{vehicle.capacity} asientos</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Ocupación</p>
          <p className="mt-1 text-slate-900">
            {vehicle.assignmentCount}/{vehicle.capacity} ({vehicle.occupancyPercent}%)
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
          <div className="mt-1">
            <StatusBadge status={vehicle.status} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase text-slate-500">Color</p>
          <p className="mt-1 text-slate-900">{vehicle.color}</p>
        </div>
      </Card>

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Conductor asignado</h2>
        {current?.driver ? (
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
              <p className="text-xs font-medium uppercase text-slate-500">Estado asignación</p>
              <div className="mt-1">
                <AssignmentStatusBadge assignment={current} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-amber-700">
            Este vehículo no tiene conductor activo.{" "}
            <Link
              href={`/dashboard/vehicles/${id}/edit`}
              className="font-medium text-indigo-600 hover:underline"
            >
              Asigne uno en edición
            </Link>
            .
          </p>
        )}
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial de conductores</h2>
      <div className="mb-10">
        <VehicleDriverAssignmentsList
          assignments={vehicle.driverAssignmentHistory}
          showDriver
          emptyTitle="Sin historial de conductores"
          emptyDescription="Las asignaciones aparecerán aquí al crear o reemplazar conductores."
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Estudiantes en ruta</h2>
      <DataTable
        columns={[
          { key: "order", header: "Orden", cell: (r) => r.pickupOrder },
          { key: "name", header: "Estudiante", cell: (r) => r.student?.fullName ?? r.studentId },
          { key: "grade", header: "Grado", cell: (r) => r.student?.grade ?? "—" },
          { key: "pickup", header: "Recogida", cell: (r) => r.pickupTime || "—" },
          { key: "dropoff", header: "Entrega", cell: (r) => r.dropoffTime || "—" },
          {
            key: "status",
            header: "Estado",
            cell: (r) => <StudentAssignmentStatusBadge assignment={r} />,
          },
        ]}
        data={vehicle.assignments}
        keyExtractor={(r) => r.id}
        emptyMessage="Sin estudiantes asignados"
      />
    </>
  );
}
