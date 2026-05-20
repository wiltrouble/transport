import Link from "next/link";
import { Suspense } from "react";
import { StudentsTable } from "@/components/students/students-table";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@school/utils";
import { studentService } from "@/services/studentService";
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

async function StudentsList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const result = await studentService.list({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search: sp.search,
    status: parseStatusFilter(sp.status),
  });

  return <StudentsTable result={result} />;
}

export default function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Estudiantes"
        description="Administre estudiantes del servicio de transporte"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Estudiantes" },
        ]}
        actions={
          <Link
            href="/dashboard/students/create"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            Nuevo estudiante
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <StudentsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
