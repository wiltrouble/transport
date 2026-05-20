import Link from "next/link";
import { Suspense } from "react";
import { OccupancyBar } from "@/components/shared/occupancy-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SessionManageView } from "@/components/sessions/session-manage-view";
import { StartSessionButton } from "@/components/sessions/start-session-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { driverService } from "@/services/driverService";
import { transportSessionService } from "@/services/transportSessionService";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import {
  VEHICLE_OPERATIONAL_STATUS_LABELS,
  type VehicleOperationalStatus,
} from "@school/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ driverId?: string }>;

const STATUS_BADGE_VARIANT: Record<
  VehicleOperationalStatus,
  "default" | "success" | "warning" | "danger"
> = {
  ready: "success",
  active: "success",
  no_driver: "warning",
  no_students: "warning",
  driver_inactive: "danger",
  vehicle_inactive: "danger",
};

async function DriverSessionContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const drivers = await driverService.listAllActive();
  const driverId = sp.driverId ?? drivers[0]?.id;

  if (!driverId) {
    return (
      <Card className="text-sm text-slate-600">
        No hay conductores activos registrados.
      </Card>
    );
  }

  const driver =
    drivers.find((d) => d.id === driverId) ?? (await driverService.getById(driverId));

  if (!driver) {
    return (
      <Card className="text-sm text-slate-600">
        Conductor no encontrado.
      </Card>
    );
  }

  // If there is already an active session for this driver, jump straight into
  // the management view — same UX they would land on right after pressing
  // "Iniciar sesión".
  const activeSession = await transportSessionService.getActiveSessionForDriver(
    driver.id,
  );
  if (activeSession) {
    const session = await transportSessionService.getByIdWithDetails(activeSession.id);
    if (session) return <SessionManageView session={session} />;
  }

  // Otherwise, find the vehicle this driver is currently assigned to and
  // present a single one-click CTA to start the session.
  const assignment = await vehicleDriverService.getActiveAssignmentForDriver(
    driver.id,
  );

  if (!assignment?.vehicleId) {
    return (
      <Card className="space-y-2 text-sm text-slate-600">
        <p className="font-medium text-slate-900">{driver.fullName}</p>
        <p className="text-amber-700">
          Este conductor no tiene vehículo asignado. Asigne un vehículo desde el
          módulo de vehículos antes de iniciar una sesión.
        </p>
        <Link
          href="/dashboard/vehicles"
          className="inline-flex items-center font-medium text-indigo-600 hover:underline"
        >
          Ir a vehículos
        </Link>
      </Card>
    );
  }

  const op = await transportSessionService.getVehicleOperationalStatus(
    assignment.vehicleId,
  );

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Conductor
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {driver.fullName}
          </p>
          <p className="text-sm text-slate-500">{driver.licenseNumber}</p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[op.operationalStatus]}>
          {VEHICLE_OPERATIONAL_STATUS_LABELS[op.operationalStatus]}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Vehículo</p>
          <Link
            href={`/dashboard/vehicles/${op.vehicle.id}`}
            className="mt-1 block font-medium text-indigo-600 hover:underline"
          >
            {op.vehicle.plate}
          </Link>
          <p className="text-xs text-slate-500">
            {op.vehicle.brand} {op.vehicle.model}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Estudiantes asignados
          </p>
          <p className="mt-1 text-slate-900">
            {op.assignedStudentCount}/{op.capacity} ({op.occupancyPercent}%)
          </p>
          <OccupancyBar percent={op.occupancyPercent} className="mt-2" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Estado de la operación
          </p>
          <p className="mt-1 text-slate-900">
            {op.blockingReason ?? "Listo para iniciar sesión"}
          </p>
        </div>
      </div>

      {op.operationalStatus === "ready" ? (
        <StartSessionButton vehicleId={op.vehicle.id} />
      ) : (
        <Link
          href={`/dashboard/vehicles/${op.vehicle.id}/edit`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Resolver desde vehículo
        </Link>
      )}
    </Card>
  );
}

async function DriverSelector({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const drivers = await driverService.listAllActive();
  if (drivers.length <= 1) return null;

  return (
    <Card className="mb-6">
      <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="driverId" className="text-sm font-medium text-slate-700">
            Conductor
          </label>
          <Select id="driverId" name="driverId" defaultValue={sp.driverId ?? drivers[0]?.id}>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Seleccionar
        </button>
      </form>
    </Card>
  );
}

export default function DriverSessionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader
        title="Operación del conductor"
        description="Iniciar viaje y registrar asistencia de estudiantes"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Conductor" },
        ]}
      />
      <Suspense fallback={<Skeleton className="mb-6 h-16 w-full" />}>
        <DriverSelector searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="mt-6 h-96 w-full" />}>
        <DriverSessionContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
