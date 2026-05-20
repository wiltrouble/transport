import { Suspense } from "react";
import { AssignVehicleDriverForm } from "@/components/vehicle-drivers/assign-vehicle-driver-form";
import { VehicleDriversTable } from "@/components/vehicle-drivers/vehicle-drivers-table";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@school/utils";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import { vehicleService } from "@/services/vehicleService";

type SearchParams = Promise<{ page?: string; search?: string; active?: string }>;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function AssignSection() {
  const [vehicles, driverOptions] = await Promise.all([
    vehicleService.listAllActive(),
    vehicleDriverService.getDriverSelectOptions(),
  ]);
  return <AssignVehicleDriverForm vehicles={vehicles} driverOptions={driverOptions} />;
}

async function AssignmentsList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const active = sp.active;
  const result = await vehicleDriverService.list({
    page: Number(sp.page) || 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: sp.search,
    activeOnly: active === "true",
    inactiveOnly: active === "false",
  });
  return <VehicleDriversTable result={result} />;
}

export default function VehicleDriversPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Asignaciones vehículo ↔ conductor"
        description="Un conductor activo por vehículo. Reemplazos conservan historial en la tabla vehicle_drivers."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Asignaciones" },
        ]}
      />

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Nueva asignación</h2>
      <div className="mb-10">
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <AssignSection />
        </Suspense>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial y asignaciones activas</h2>
      <Suspense fallback={<TableSkeleton />}>
        <AssignmentsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
