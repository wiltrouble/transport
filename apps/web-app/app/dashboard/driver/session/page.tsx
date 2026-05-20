import { Suspense } from "react";
import { SessionManageView } from "@/components/sessions/session-manage-view";
import { TransportSessionForm } from "@/components/sessions/transport-session-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { driverService } from "@/services/driverService";
import { transportSessionService } from "@/services/transportSessionService";
import { vehicleService } from "@/services/vehicleService";

type SearchParams = Promise<{ driverId?: string }>;

async function DriverSessionContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const drivers = await driverService.listAllActive();
  const driverId = sp.driverId ?? drivers[0]?.id;

  if (!driverId) {
    return (
      <Card className="p-6 text-sm text-slate-600">
        No hay conductores activos registrados.
      </Card>
    );
  }

  const driver = drivers.find((d) => d.id === driverId) ?? (await driverService.getById(driverId));
  const activeSession = await transportSessionService.getActiveSessionForDriver(driverId);

  if (activeSession) {
    const session = await transportSessionService.getByIdWithDetails(activeSession.id);
    if (session) {
      return <SessionManageView session={session} />;
    }
  }

  const vehicles = await vehicleService.listAllActive();

  return (
    <div className="space-y-8">
      <Card className="p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">{driver?.fullName ?? "Conductor"}</p>
        <p className="mt-1">
          Inicie una sesión de transporte. Los estudiantes del vehículo se cargarán automáticamente desde las asignaciones de ruta.
        </p>
      </Card>
      <TransportSessionForm
        vehicles={vehicles}
        drivers={driver ? [driver] : drivers}
        defaultDriverId={driverId}
      />
    </div>
  );
}

export default function DriverSessionPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Operación del conductor"
        description="Iniciar viaje y registrar asistencia de estudiantes"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Conductor" },
        ]}
      />
      <Suspense fallback={<Skeleton className="mb-6 h-16 w-full" />}>
        <DriverSelector searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="mt-6 h-96 w-full" />}>
        <DriverSessionContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DriverSelector({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const drivers = await driverService.listAllActive();

  if (drivers.length <= 1) return null;

  return (
    <Card className="mb-6 p-4">
      <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="driverId" className="text-sm font-medium text-slate-700">
            Conductor
          </label>
          <Select id="driverId" name="driverId" defaultValue={sp.driverId ?? drivers[0]?.id}>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Seleccionar
        </button>
      </form>
    </Card>
  );
}
