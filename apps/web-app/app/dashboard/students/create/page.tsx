import { PageHeader } from "@/components/shared/page-header";
import { StudentCreateForm } from "@/components/students/student-create-form";
import { parentService } from "@/services/parentService";

export default async function CreateStudentPage() {
  const parents = await parentService.listAllActive();

  return (
    <>
      <PageHeader
        title="Nuevo estudiante"
        description="Flujo alternativo: estudiante y responsable en un solo paso. Para el flujo recomendado, cree primero el padre/madre en Padres."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Estudiantes", href: "/dashboard/students" },
          { label: "Crear" },
        ]}
      />
      <StudentCreateForm parents={parents} />
    </>
  );
}
