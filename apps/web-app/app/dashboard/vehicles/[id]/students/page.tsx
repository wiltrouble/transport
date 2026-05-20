import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleStudentsManager } from "@/components/vehicles/vehicle-students-manager";
import { vehicleStudentService } from "@/services/vehicleStudentService";
import { vehicleService } from "@/services/vehicleService";

type Props = { params: Promise<{ id: string }> };

export default async function VehicleStudentsPage({ params }: Props) {
  const { id } = await params;
  const vehicle = await vehicleService.getByIdWithDetails(id);
  if (!vehicle) notFound();

  const studentOptions = await vehicleStudentService.getStudentSelectOptions({
    vehicleId: id,
  });

  return (
    <>
      <PageHeader
        title={`Ruta — ${vehicle.plate}`}
        description={`${vehicle.brand} ${vehicle.model} · ${vehicle.assignmentCount}/${vehicle.capacity} asientos (${vehicle.occupancyPercent}% ocupación)`}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Vehículos", href: "/dashboard/vehicles" },
          { label: vehicle.plate, href: `/dashboard/vehicles/${id}` },
          { label: "Estudiantes" },
        ]}
      />
      <VehicleStudentsManager vehicle={vehicle} studentOptions={studentOptions} />
    </>
  );
}
