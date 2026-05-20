"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SESSION_SHIFT_LABELS } from "@school/utils";
import { formatDate, formatDateTime } from "@school/utils";
import type { PaginatedResult } from "@school/types";
import type { TransportSessionListItem } from "@school/types";

export function SessionsTable({
  result,
}: {
  result: PaginatedResult<TransportSessionListItem>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/dashboard/sessions?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Buscar placa, conductor o fecha…"
          defaultValue={searchParams.get("search") ?? ""}
          onSearch={(v) => updateParams("search", v)}
        />
        <Select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => updateParams("status", e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="active">En curso</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </Select>
      </div>

      <DataTable
        columns={[
          {
            key: "vehicle",
            header: "Vehículo",
            cell: (r) => (
              <Link
                href={`/dashboard/sessions/${r.id}`}
                className="font-medium text-indigo-600 hover:underline"
              >
                {r.vehicle?.plate ?? r.vehicleId}
              </Link>
            ),
          },
          {
            key: "driver",
            header: "Conductor",
            cell: (r) => r.driver?.fullName ?? r.driverId,
          },
          {
            key: "date",
            header: "Fecha",
            cell: (r) => formatDate(r.sessionDate),
          },
          {
            key: "shift",
            header: "Turno",
            cell: (r) =>
              SESSION_SHIFT_LABELS[r.shift as keyof typeof SESSION_SHIFT_LABELS] ?? r.shift,
          },
          {
            key: "status",
            header: "Estado",
            cell: (r) => <SessionStatusBadge status={r.status} />,
          },
          {
            key: "start",
            header: "Inicio",
            cell: (r) => formatDateTime(r.startTime),
          },
          {
            key: "end",
            header: "Fin",
            cell: (r) => formatDateTime(r.endTime),
          },
          {
            key: "students",
            header: "Estudiantes",
            cell: (r) => String(r.studentCount),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            cell: (r) => (
              <Link
                href={`/dashboard/sessions/${r.id}/manage`}
                className="text-sm text-indigo-600 hover:underline"
              >
                Gestionar
              </Link>
            ),
          },
        ]}
        data={result.items}
        keyExtractor={(r) => r.id}
        emptyMessage="No hay sesiones de transporte"
      />

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Página {result.page} de {result.totalPages} ({result.total} registros)
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={result.page <= 1}
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.set("page", String(result.page - 1));
              router.push(`/dashboard/sessions?${p}`);
            }}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={result.page >= result.totalPages}
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.set("page", String(result.page + 1));
              router.push(`/dashboard/sessions?${p}`);
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
