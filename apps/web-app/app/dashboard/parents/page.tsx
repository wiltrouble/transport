import Link from "next/link";
import { Suspense } from "react";
import { ParentsTable } from "@/components/parents/parents-table";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@school/utils";
import { parentService } from "@/services/parentService";
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

async function ParentsList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const result = await parentService.list({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search: sp.search,
    status: parseStatusFilter(sp.status),
  });

  return <ParentsTable result={result} />;
}

export default function ParentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Padres"
        description="Administre padres, madres y tutores del transporte escolar"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Padres" },
        ]}
        actions={
          <Link
            href="/dashboard/parents/create"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            Nuevo padre/madre
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <ParentsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
