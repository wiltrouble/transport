import Link from "next/link";
import { Suspense } from "react";
import { DriversTable } from "@/components/drivers/drivers-table";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@school/utils";
import { driverService } from "@/services/driverService";
import { parseStatusFilter } from "@school/utils";

type SearchParams = Promise<{ page?: string; search?: string; status?: string }>;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function DriversList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const result = await driverService.list({
    page: Number(sp.page) || 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: sp.search,
    status: parseStatusFilter(sp.status),
  });
  return <DriversTable result={result} />;
}

export default function DriversPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Conductores"
        description="Administre conductores y licencias"
        breadcrumbs={[{ label: "Inicio", href: "/dashboard" }, { label: "Conductores" }]}
        actions={
          <Link href="/dashboard/drivers/create" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500">
            Nuevo conductor
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <DriversList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
