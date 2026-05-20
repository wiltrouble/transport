import Link from "next/link";
import { Car, Users } from "lucide-react";
import { OccupancyBar } from "@/components/shared/occupancy-bar";
import { StartSessionButton } from "@/components/sessions/start-session-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  OperationalVehicle,
  VehicleOperationalStatus,
} from "@school/types";
import { VEHICLE_OPERATIONAL_STATUS_LABELS } from "@school/types";

type Variant = "default" | "success" | "warning" | "danger";

const STATUS_VARIANT: Record<VehicleOperationalStatus, Variant> = {
  ready: "success",
  active: "success",
  no_driver: "warning",
  no_students: "warning",
  driver_inactive: "danger",
  vehicle_inactive: "danger",
};

/**
 * Single operational unit on the Transport Sessions dashboard.
 *
 * - When the vehicle is `ready`, exposes the one-click "Iniciar sesión" CTA.
 * - When the vehicle has an active session, links to its manage view and a
 *   live "En curso" pill.
 * - Otherwise, shows the exact blocking reason plus a direct link to the
 *   vehicle's edit screen so the operator can fix it.
 */
export function OperationalVehicleCard({
  data,
}: {
  data: OperationalVehicle;
}) {
  const { vehicle, driver, activeSession, operationalStatus } = data;
  const isActive = operationalStatus === "active";
  const isReady = operationalStatus === "ready";

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Car className="size-4" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">
              Vehículo
            </span>
          </div>
          <Link
            href={`/dashboard/vehicles/${vehicle.id}`}
            className="mt-1 inline-block truncate text-lg font-semibold text-slate-900 hover:text-indigo-600"
          >
            {vehicle.plate}
          </Link>
          <p className="truncate text-sm text-slate-500">
            {vehicle.brand} {vehicle.model} · {vehicle.year}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[operationalStatus]}>
          {VEHICLE_OPERATIONAL_STATUS_LABELS[operationalStatus]}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Conductor
          </p>
          {driver ? (
            <Link
              href={`/dashboard/drivers/${driver.id}`}
              className="mt-1 block truncate font-medium text-indigo-600 hover:underline"
            >
              {driver.fullName}
            </Link>
          ) : (
            <p className="mt-1 text-amber-700">Sin conductor</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Ocupación
          </p>
          <div className="mt-1 flex items-center gap-2 text-slate-900">
            <Users className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="font-medium">
              {data.assignedStudentCount}/{data.capacity}
            </span>
            <span className="text-xs text-slate-500">
              ({data.occupancyPercent}%)
            </span>
          </div>
          <OccupancyBar percent={data.occupancyPercent} className="mt-2" />
        </div>
      </div>

      {isActive && activeSession ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <p className="font-medium">Sesión en curso</p>
          <p className="mt-0.5">
            Inicio {formatTime(activeSession.startTime)} · {activeSession.shift}
          </p>
        </div>
      ) : null}

      {data.blockingReason ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="font-medium">No disponible para iniciar</p>
          <p className="mt-0.5">{data.blockingReason}</p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {isActive && activeSession ? (
          <>
            <Link
              href={`/dashboard/sessions/${activeSession.id}/manage`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Gestionar sesión
            </Link>
            <Link
              href={`/dashboard/sessions/${activeSession.id}`}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Ver detalle
            </Link>
          </>
        ) : isReady ? (
          <>
            <StartSessionButton vehicleId={vehicle.id} />
            <Link
              href={`/dashboard/vehicles/${vehicle.id}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Ver vehículo
            </Link>
          </>
        ) : (
          <Link
            href={`/dashboard/vehicles/${vehicle.id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Resolver desde vehículo
          </Link>
        )}
      </div>
    </Card>
  );
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
