import Link from "next/link";
import { Suspense } from "react";
import { VehiclesTable } from "@/components/vehicles/vehicles-table";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@school/utils";
import { vehicleService } from "@/services/vehicleService";
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

async function VehiclesList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const result = await vehicleService.list({
    page: Number(sp.page) || 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: sp.search,
    status: parseStatusFilter(sp.status),
  });
  return <VehiclesTable result={result} />;
}

export default function VehiclesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Vehículos"
        description="Flota, capacidad y asignación de estudiantes"
        breadcrumbs={[{ label: "Inicio", href: "/dashboard" }, { label: "Vehículos" }]}
        actions={
          <Link href="/dashboard/vehicles/create" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500">
            Nuevo vehículo
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <VehiclesList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
