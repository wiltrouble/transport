import { notFound } from "next/navigation";
import { DriverForm } from "@/components/drivers/driver-form";
import { PageHeader } from "@/components/shared/page-header";
import { driverService } from "@/services/driverService";

type Props = { params: Promise<{ id: string }> };

export default async function EditDriverPage({ params }: Props) {
  const { id } = await params;
  const driver = await driverService.getById(id);
  if (!driver) notFound();

  return (
    <>
      <PageHeader
        title={`Editar — ${driver.fullName}`}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Conductores", href: "/dashboard/drivers" },
          { label: driver.fullName, href: `/dashboard/drivers/${id}` },
          { label: "Editar" },
        ]}
      />
      <DriverForm mode="edit" driver={driver} />
    </>
  );
}
