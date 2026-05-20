import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import type { Parent } from "@school/types";

type ParentSummaryCardProps = {
  parent: Parent;
};

export function ParentSummaryCard({ parent }: ParentSummaryCardProps) {
  return (
    <Card className="mb-6 border-indigo-100 bg-indigo-50/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        Responsable registrado
      </p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">{parent.fullName}</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Correo</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{parent.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Teléfono</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{parent.phone}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Estado</dt>
          <dd className="mt-1">
            <StatusBadge status={parent.status} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}
