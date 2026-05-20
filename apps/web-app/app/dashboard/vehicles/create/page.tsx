import { PageHeader } from "@/components/shared/page-header";
import { VehicleCreateWizard } from "@/components/vehicles/vehicle-create-wizard";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import { vehicleStudentService } from "@/services/vehicleStudentService";

export default async function CreateVehiclePage() {
  const [driverOptions, studentOptions] = await Promise.all([
    vehicleDriverService.getDriverSelectOptions(),
    vehicleStudentService.getStudentSelectOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Nuevo vehículo"
        description="Registre el vehículo, asigne un conductor y, opcionalmente, los estudiantes que cubrirá."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: "Crear" },
        ]}
      />
      <VehicleCreateWizard
        driverOptions={driverOptions}
        studentOptions={studentOptions}
      />
    </>
  );
}
