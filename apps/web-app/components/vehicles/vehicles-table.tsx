"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteVehicleAction } from "@/app/actions/vehicles";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { PaginatedResult } from "@school/types";
import type { VehicleListItem } from "@school/types";

export function VehiclesTable({ result }: { result: PaginatedResult<VehicleListItem> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateParams(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/dashboard/vehicles?${p.toString()}`);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setLoading(true);
    const res = await deleteVehicleAction(deleteId);
    setLoading(false);
    setDeleteId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Vehículo eliminado");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Buscar placa, marca o modelo…"
          defaultValue={searchParams.get("search") ?? ""}
          onSearch={(v) => updateParams("search", v)}
        />
        <Select defaultValue={searchParams.get("status") ?? ""} onChange={(e) => updateParams("status", e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </Select>
      </div>

      <DataTable
        columns={[
          {
            key: "plate",
            header: "Placa",
            cell: (r) => (
              <Link href={`/dashboard/vehicles/${r.id}`} className="font-medium text-indigo-600 hover:underline">
                {r.plate}
              </Link>
            ),
          },
          { key: "vehicle", header: "Vehículo", cell: (r) => `${r.brand} ${r.model} (${r.year})` },
          { key: "capacity", header: "Capacidad", cell: (r) => String(r.capacity) },
          {
            key: "occupancy",
            header: "Ocupación",
            cell: (r) => (
              <span>
                {r.assignmentCount}/{r.capacity} ({r.occupancyPercent}%)
              </span>
            ),
          },
          { key: "status", header: "Estado", cell: (r) => <StatusBadge status={r.status} /> },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
              <div className="flex justify-end gap-2">
                <Link href={`/dashboard/vehicles/${r.id}`} className="text-sm text-slate-600 hover:text-indigo-600">
                  Ver
                </Link>
                <Link href={`/dashboard/vehicles/${r.id}/edit`} className="text-sm text-slate-600 hover:text-indigo-600">
                  Editar
                </Link>
                <button type="button" className="text-sm text-red-600 hover:text-red-700" onClick={() => setDeleteId(r.id)}>
                  Eliminar
                </button>
              </div>
            ),
          },
        ]}
        data={result.items}
        keyExtractor={(r) => r.id}
        emptyMessage="No hay vehículos registrados"
      />

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Página {result.page} de {result.totalPages} ({result.total} registros)
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={result.page <= 1} onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("page", String(result.page - 1)); router.push(`/dashboard/vehicles?${p}`); }}>Anterior</Button>
          <Button variant="secondary" disabled={result.page >= result.totalPages} onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("page", String(result.page + 1)); router.push(`/dashboard/vehicles?${p}`); }}>Siguiente</Button>
        </div>
      </div>

      <ConfirmDialog open={Boolean(deleteId)} title="Eliminar vehículo" description="No se puede eliminar si tiene estudiantes asignados." confirmLabel="Eliminar" variant="danger" loading={loading} onConfirm={() => void confirmDelete()} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
