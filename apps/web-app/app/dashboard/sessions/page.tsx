import Link from "next/link";
import { Suspense } from "react";
import { OperationalDashboard } from "@/components/sessions/operational-dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { transportSessionService } from "@/services/transportSessionService";

export const dynamic = "force-dynamic";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    </div>
  );
}

async function OperationalContent() {
  const vehicles = await transportSessionService.getOperationalVehicles();
  return <OperationalDashboard vehicles={vehicles} />;
}

export default function SessionsPage() {
  return (
    <>
      <PageHeader
        title="Operación de transporte"
        description="Inicia y supervisa sesiones desde cada vehículo asignado"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Sesiones" },
        ]}
        actions={
          <Link
            href="/dashboard/sessions/history"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Ver historial
          </Link>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <OperationalContent />
      </Suspense>
    </>
  );
}
