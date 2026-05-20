import { PageHeader } from "@/components/shared/page-header";
import { TransportSessionForm } from "@/components/sessions/transport-session-form";
import { driverService } from "@/services/driverService";
import { vehicleService } from "@/services/vehicleService";

export default async function CreateSessionPage() {
  const [vehicles, drivers] = await Promise.all([
    vehicleService.listAllActive(),
    driverService.listAllActive(),
  ]);

  return (
    <>
      <PageHeader
        title="Nueva sesión de transporte"
        description="Se cargarán automáticamente los estudiantes asignados al vehículo"
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Sesiones", href: "/dashboard/sessions" },
          { label: "Crear" },
        ]}
      />
      <TransportSessionForm vehicles={vehicles} drivers={drivers} />
    </>
  );
}
