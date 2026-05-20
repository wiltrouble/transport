import Link from "next/link";
import { Suspense } from "react";
import { SessionsTable } from "@/components/sessions/sessions-table";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@school/utils";
import type { TransportSessionStatus } from "@school/utils";
import { transportSessionService } from "@/services/transportSessionService";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ page?: string; search?: string; status?: string }>;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function SessionsList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = sp.status as TransportSessionStatus | undefined;
  const result = await transportSessionService.list({
    page: Number(sp.page) || 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: sp.search,
    sessionStatus: status && status.length > 0 ? status : undefined,
  });
  return <SessionsTable result={result} />;
}

export default function SessionsHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader
        title="Historial de sesiones"
        description="Viajes pasados, asistencia y cancelaciones"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Sesiones", href: "/dashboard/sessions" },
          { label: "Historial" },
        ]}
        actions={
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            Volver a operación
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <SessionsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
