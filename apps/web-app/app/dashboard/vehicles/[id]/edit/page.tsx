import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import { vehicleService } from "@/services/vehicleService";

type Props = { params: Promise<{ id: string }> };

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params;
  const vehicle = await vehicleService.getById(id);
  if (!vehicle) notFound();

  const current = await vehicleDriverService.getCurrentVehicleDriver(id);
  const driverOptions = await vehicleDriverService.getDriverSelectOptions({
    includeDriverId: current?.driverId,
  });

  return (
    <>
      <PageHeader
        title={`Editar — ${vehicle.plate}`}
        description="Puede reemplazar el conductor; el historial de asignaciones se conserva."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: vehicle.plate, href: `/dashboard/vehicles/${id}` },
          { label: "Editar" },
        ]}
      />
      <VehicleForm
        mode="edit"
        vehicle={vehicle}
        driverOptions={driverOptions}
        initialDriverId={current?.driverId ?? ""}
      />
    </>
  );
}
