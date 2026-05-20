import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleEditPanels } from "@/components/vehicles/vehicle-edit-panels";
import { vehicleDriverService } from "@/services/vehicleDriverService";
import { vehicleService } from "@/services/vehicleService";
import { vehicleStudentService } from "@/services/vehicleStudentService";

type Props = { params: Promise<{ id: string }> };

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params;
  const vehicle = await vehicleService.getByIdWithDetails(id);
  if (!vehicle) notFound();

  const currentDriverId = vehicle.currentDriverAssignment?.driverId;
  const [driverOptions, studentOptions] = await Promise.all([
    vehicleDriverService.getDriverSelectOptions({ includeDriverId: currentDriverId }),
    vehicleStudentService.getStudentSelectOptions({ vehicleId: id }),
  ]);

  return (
    <>
      <PageHeader
        title={`Editar — ${vehicle.plate}`}
        description="Información, conductor y estudiantes en una sola pantalla. El historial se conserva."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: vehicle.plate, href: `/dashboard/vehicles/${id}` },
          { label: "Editar" },
        ]}
      />
      <VehicleEditPanels
        vehicle={vehicle}
        driverOptions={driverOptions}
        studentOptions={studentOptions}
        initialDriverId={currentDriverId ?? ""}
      />
    </>
  );
}
