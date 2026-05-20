"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteParentAction } from "@/app/actions/parents";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PaginatedResult } from "@school/types";
import type { Parent } from "@school/types";

export function ParentsTable({ result }: { result: PaginatedResult<Parent> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateParams(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`/dashboard/parents?${p.toString()}`);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setLoading(true);
    const res = await deleteParentAction(deleteId);
    setLoading(false);
    setDeleteId(null);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Padre/madre eliminado");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Buscar nombre, correo o teléfono…" defaultValue={searchParams.get("search") ?? ""} onKeyDown={(e) => { if (e.key === "Enter") updateParams("search", (e.target as HTMLInputElement).value); }} className="sm:max-w-xs" />
        <Select defaultValue={searchParams.get("status") ?? ""} onChange={(e) => updateParams("status", e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </Select>
        <Button type="button" variant="secondary" onClick={() => { const i = document.querySelector<HTMLInputElement>("input[placeholder^=Buscar]"); updateParams("search", i?.value ?? ""); }}>Buscar</Button>
      </div>
      <DataTable columns={[
        { key: "name", header: "Nombre", cell: (r) => <Link href={`/dashboard/parents/${r.id}`} className="font-medium text-indigo-600 hover:underline">{r.fullName}</Link> },
        { key: "email", header: "Correo", cell: (r) => r.email },
        { key: "phone", header: "Teléfono", cell: (r) => r.phone },
        { key: "status", header: "Estado", cell: (r) => <StatusBadge status={r.status} /> },
        { key: "actions", header: "", className: "text-right", cell: (r) => (
          <div className="flex justify-end gap-2">
            <Link href={`/dashboard/parents/${r.id}/edit`} className="text-sm text-slate-600 hover:text-indigo-600">Editar</Link>
            <button type="button" className="text-sm text-red-600 hover:text-red-700" onClick={() => setDeleteId(r.id)}>Eliminar</button>
          </div>
        )},
      ]} data={result.items} keyExtractor={(r) => r.id} emptyMessage="No hay padres registrados" />
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Página {result.page} de {result.totalPages} ({result.total} registros)</span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={result.page <= 1} onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("page", String(result.page - 1)); router.push(`/dashboard/parents?${p}`); }}>Anterior</Button>
          <Button variant="secondary" disabled={result.page >= result.totalPages} onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("page", String(result.page + 1)); router.push(`/dashboard/parents?${p}`); }}>Siguiente</Button>
        </div>
      </div>
      <ConfirmDialog open={Boolean(deleteId)} title="Eliminar padre/madre" description="Esta acción no se puede deshacer. No se permite si tiene estudiantes vinculados." confirmLabel="Eliminar" variant="danger" loading={loading} onConfirm={() => void confirmDelete()} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
