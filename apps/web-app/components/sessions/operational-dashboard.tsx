"use client";

import { useMemo, useState } from "react";
import { OperationalVehicleCard } from "@/components/sessions/operational-vehicle-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  OperationalVehicle,
  VehicleOperationalStatus,
} from "@school/types";
import { VEHICLE_OPERATIONAL_STATUS_LABELS } from "@school/types";

type DashboardFilter = "all" | VehicleOperationalStatus;

const FILTER_OPTIONS: { value: DashboardFilter; label: string }[] = [
  { value: "all", label: "Todos los vehículos" },
  { value: "ready", label: VEHICLE_OPERATIONAL_STATUS_LABELS.ready },
  { value: "active", label: VEHICLE_OPERATIONAL_STATUS_LABELS.active },
  { value: "no_driver", label: VEHICLE_OPERATIONAL_STATUS_LABELS.no_driver },
  { value: "no_students", label: VEHICLE_OPERATIONAL_STATUS_LABELS.no_students },
  {
    value: "driver_inactive",
    label: VEHICLE_OPERATIONAL_STATUS_LABELS.driver_inactive,
  },
  {
    value: "vehicle_inactive",
    label: VEHICLE_OPERATIONAL_STATUS_LABELS.vehicle_inactive,
  },
];

/**
 * Client-side filter/search over the pre-computed operational vehicle list.
 * The list itself is small (<= fleet size) so we avoid round-trips and keep
 * interactions feeling instant.
 */
export function OperationalDashboard({
  vehicles,
}: {
  vehicles: OperationalVehicle[];
}) {
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c: Record<VehicleOperationalStatus, number> = {
      ready: 0,
      active: 0,
      no_driver: 0,
      no_students: 0,
      driver_inactive: 0,
      vehicle_inactive: 0,
    };
    for (const v of vehicles) c[v.operationalStatus] += 1;
    return c;
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (filter !== "all" && v.operationalStatus !== filter) return false;
      if (!q) return true;
      return (
        v.vehicle.plate.toLowerCase().includes(q) ||
        `${v.vehicle.brand} ${v.vehicle.model}`.toLowerCase().includes(q) ||
        (v.driver?.fullName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [filter, search, vehicles]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryTile label="Listos" value={counts.ready} tone="success" />
        <SummaryTile label="En curso" value={counts.active} tone="info" />
        <SummaryTile label="Sin conductor" value={counts.no_driver} tone="warning" />
        <SummaryTile
          label="Sin estudiantes"
          value={counts.no_students}
          tone="warning"
        />
        <SummaryTile
          label="Conductor inactivo"
          value={counts.driver_inactive}
          tone="danger"
        />
        <SummaryTile
          label="Vehículo inactivo"
          value={counts.vehicle_inactive}
          tone="danger"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar placa, modelo o conductor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as DashboardFilter)}
          className="sm:max-w-xs"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">
          {vehicles.length === 0
            ? "No hay vehículos registrados todavía. Cree un vehículo para empezar."
            : "Ningún vehículo coincide con los filtros aplicados."}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <OperationalVehicleCard key={v.vehicle.id} data={v} />
          ))}
        </div>
      )}
    </div>
  );
}

type Tone = "success" | "info" | "warning" | "danger";

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  const styles: Record<Tone, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    info: "bg-indigo-50 text-indigo-700 border-indigo-100",
    warning: "bg-amber-50 text-amber-800 border-amber-100",
    danger: "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm shadow-slate-200/40 ${styles[tone]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
