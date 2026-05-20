import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card-title";
import { LogoutButton } from "@/components/auth/logout-button";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  driver: "Conductor",
  parent: "Padre / madre",
  none: "Sin rol asignado",
};

function describeReason(reason: string | null): string {
  switch (reason) {
    case "inactive":
      return "Su cuenta está marcada como inactiva. Solicite al administrador que la reactive.";
    case "admin_required":
      return "Esta sección está reservada para administradores.";
    default:
      return "No tiene permisos para acceder a esta sección.";
  }
}

type UnauthorizedCardProps = {
  requiredRole: string | null;
  actualRole: string | null;
  reason: string | null;
};

export function UnauthorizedCard({
  requiredRole,
  actualRole,
  reason,
}: UnauthorizedCardProps) {
  const requiredLabel = requiredRole
    ? requiredRole
        .split(",")
        .map((r) => ROLE_LABELS[r.trim()] ?? r.trim())
        .join(", ")
    : "Administrador";
  const actualLabel = actualRole ? ROLE_LABELS[actualRole] ?? actualRole : null;

  return (
    <Card className="w-full max-w-md space-y-5 text-center shadow-lg shadow-slate-200/80">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-red-600">
          Acceso denegado
        </p>
        <CardTitle className="text-balance text-xl sm:text-2xl">
          No tiene permisos suficientes
        </CardTitle>
        <p className="text-sm text-slate-500">{describeReason(reason)}</p>
      </div>

      <dl className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Rol requerido</dt>
          <dd className="font-medium text-slate-900">{requiredLabel}</dd>
        </div>
        {actualLabel ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Su rol actual</dt>
            <dd className="font-medium text-slate-900">{actualLabel}</dd>
          </div>
        ) : null}
      </dl>

      {actualRole === "driver" || actualRole === "parent" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
          Esta cuenta solo puede usarse desde la aplicación móvil de Transporte
          Escolar. Cierre sesión e inicie sesión desde su teléfono.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Volver al inicio
        </Link>
        <LogoutButton />
      </div>
    </Card>
  );
}
