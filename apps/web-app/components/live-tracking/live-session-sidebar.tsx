"use client";

import { cn } from "@school/utils";
import type { LiveVehicleTracking } from "@school/types";
import { TrackingStatusBadge } from "@/components/live-tracking/tracking-status-badge";

type LiveSessionSidebarProps = {
  vehicles: LiveVehicleTracking[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
};

export function LiveSessionSidebar({
  vehicles,
  selectedSessionId,
  onSelect,
}: LiveSessionSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white lg:w-80 lg:shrink-0">
      <div className="border-b border-slate-100 px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Sesiones activas</h2>
        <p className="mt-1 text-xs text-slate-500">
          {vehicles.length} vehículo{vehicles.length === 1 ? "" : "s"} en ruta
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {vehicles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            No hay sesiones activas en este momento.
          </p>
        ) : (
          <ul className="space-y-2">
            {vehicles.map((vehicle) => {
              const selected = vehicle.transportSessionId === selectedSessionId;
              const lastUpdate = vehicle.latestPoint?.trackedAt
                ? new Date(vehicle.latestPoint.trackedAt).toLocaleTimeString()
                : "Sin datos";

              return (
                <li key={vehicle.transportSessionId}>
                  <button
                    type="button"
                    onClick={() => onSelect(vehicle.transportSessionId)}
                    className={cn(
                      "w-full rounded-2xl border p-3 text-left transition",
                      selected
                        ? "border-indigo-300 bg-indigo-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{vehicle.vehiclePlate}</p>
                        <p className="text-xs text-slate-600">{vehicle.driverName}</p>
                      </div>
                      <TrackingStatusBadge status={vehicle.status} />
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                      <div>
                        <dt className="sr-only">Estudiantes</dt>
                        <dd>{vehicle.studentCount} estudiantes</dd>
                      </div>
                      <div className="text-right">
                        <dt className="sr-only">Velocidad</dt>
                        <dd>
                          {vehicle.latestPoint
                            ? `${(vehicle.latestPoint.speed * 3.6).toFixed(0)} km/h`
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Última actualización: {lastUpdate}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
