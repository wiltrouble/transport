import { PageHeader } from "@/components/shared/page-header";
import { ParentForm } from "@/components/parents/parent-form";

export default function CreateParentPage() {
  return (
    <>
      <PageHeader
        title="Nuevo padre/madre"
        description="Se crea la cuenta de Appwrite Auth y el registro en la tabla parents. Luego podrá vincular estudiantes."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Padres", href: "/dashboard/parents" },
          { label: "Crear" },
        ]}
      />
      <ParentForm mode="create" />
    </>
  );
}
