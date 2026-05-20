import type { Metadata } from "next";
import { UnauthorizedCard } from "@/components/auth/unauthorized-card";

export const metadata: Metadata = {
  title: "Acceso denegado | Transporte Escolar",
  description: "No tiene permisos para acceder al panel administrativo.",
};

export const dynamic = "force-dynamic";

type SearchParams = {
  required?: string;
  actual?: string;
  reason?: string;
};

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-12">
      <UnauthorizedCard
        requiredRole={params.required ?? null}
        actualRole={params.actual ?? null}
        reason={params.reason ?? null}
      />
    </div>
  );
}
