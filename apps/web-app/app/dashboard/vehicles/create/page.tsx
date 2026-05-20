import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { vehicleDriverService } from "@/services/vehicleDriverService";

export default async function CreateVehiclePage() {
  const driverOptions = await vehicleDriverService.getDriverSelectOptions();

  return (
    <>
      <PageHeader
        title="Nuevo vehículo"
        description="Cada vehículo debe tener un conductor activo asignado al crearse."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: "Crear" },
        ]}
      />
      <VehicleForm mode="create" driverOptions={driverOptions} />
    </>
  );
}
