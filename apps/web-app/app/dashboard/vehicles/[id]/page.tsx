import Link from "next/link";
import { notFound } from "next/navigation";
import { StartSessionButton } from "@/components/sessions/start-session-button";
import { AssignmentStatusBadge } from "@/components/vehicle-drivers/assignment-status-badge";
import { VehicleDriverAssignmentsList } from "@/components/vehicle-drivers/vehicle-driver-assignments-list";
import { DataTable } from "@/components/shared/data-table";
import { OccupancyBar } from "@/components/shared/occupancy-bar";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StudentAssignmentStatusBadge } from "@/components/vehicle-students/student-assignment-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@school/utils";
import { transportSessionService } from "@/services/transportSessionService";
import { vehicleService } from "@/services/vehicleService";

type Props = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;
  const vehicle = await vehicleService.getByIdWithDetails(id);
  if (!vehicle) notFound();

  const op = await transportSessionService.getVehicleOperationalStatus(id);
  const activeSession = op.activeSession;
  const current = vehicle.currentDriverAssignment;
  const canStartSession = op.operationalStatus === "ready";

  return (
    <>
      <PageHeader
        title={vehicle.plate}
        description={`${vehicle.brand} ${vehicle.model} (${vehicle.year})`}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: vehicle.plate },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canStartSession ? <StartSessionButton vehicleId={id} /> : null}
            {activeSession ? (
              <Link
                href={`/dashboard/sessions/${activeSession.id}/manage`}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
              >
                Gestionar sesión activa
              </Link>
            ) : null}
            <Link
              href={`/dashboard/vehicles/${id}/edit`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Editar vehículo y asignaciones
            </Link>
          </div>
        }
      />

      <Card className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Capacidad</p>
          <p className="mt-1 text-slate-900">{vehicle.capacity} asientos</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Ocupación</p>
          <p className="mt-1 text-slate-900">
            {vehicle.assignmentCount}/{vehicle.capacity} ({vehicle.occupancyPercent}%)
          </p>
          <OccupancyBar percent={vehicle.occupancyPercent} className="mt-2" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Color</p>
          <p className="mt-1 text-slate-900">{vehicle.color}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
          <div className="mt-1">
            <StatusBadge status={vehicle.status} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Sesión activa</p>
          <div className="mt-1">
            {activeSession ? (
              <Link
                href={`/dashboard/sessions/${activeSession.id}`}
                className="inline-flex items-center"
              >
                <Badge variant="success">En curso</Badge>
              </Link>
            ) : (
              <Badge variant="default">Sin sesión</Badge>
            )}
          </div>
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
              Asigne uno desde editar vehículo
            </Link>
            .
          </p>
        )}
      </Card>

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

      <h2 className="mb-3 mt-10 text-lg font-semibold text-slate-900">
        Historial de conductores
      </h2>
      <VehicleDriverAssignmentsList
        assignments={vehicle.driverAssignmentHistory}
        showDriver
        emptyTitle="Sin historial de conductores"
        emptyDescription="Las asignaciones aparecerán aquí al crear o reemplazar conductores."
      />
    </>
  );
}
