import { PageHeader } from "@/components/shared/page-header";
import { DriverForm } from "@/components/drivers/driver-form";

export default function CreateDriverPage() {
  return (
    <>
      <PageHeader
        title="Nuevo conductor"
        description="Se creará la cuenta de acceso en Appwrite Auth y el registro en la tabla de conductores."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Conductores", href: "/dashboard/drivers" },
          { label: "Crear" },
        ]}
      />
      <DriverForm mode="create" />
    </>
  );
}
