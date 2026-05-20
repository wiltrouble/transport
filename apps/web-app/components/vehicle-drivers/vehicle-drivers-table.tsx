"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { VehicleDriverAssignmentsList } from "@/components/vehicle-drivers/vehicle-driver-assignments-list";
import { SearchInput } from "@/components/shared/search-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { PaginatedResult } from "@school/types";
import type { VehicleDriverAssignment } from "@school/types";

export function VehicleDriversTable({
  result,
}: {
  result: PaginatedResult<VehicleDriverAssignment>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/dashboard/vehicle-drivers?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Buscar placa, conductor o licencia…"
          defaultValue={searchParams.get("search") ?? ""}
          onSearch={(v) => updateParams("search", v)}
        />
        <Select
          defaultValue={searchParams.get("active") ?? ""}
          onChange={(e) => updateParams("active", e.target.value)}
        >
          <option value="">Todas las asignaciones</option>
          <option value="true">Solo activas</option>
          <option value="false">Solo finalizadas</option>
        </Select>
      </div>

      <VehicleDriverAssignmentsList
        assignments={result.items}
        showVehicle
        showDriver
        emptyTitle="No hay asignaciones registradas"
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
              router.push(`/dashboard/vehicle-drivers?${p}`);
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
              router.push(`/dashboard/vehicle-drivers?${p}`);
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
