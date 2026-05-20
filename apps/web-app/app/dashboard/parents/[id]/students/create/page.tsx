import { notFound } from "next/navigation";
import { ParentFirstStudentForm } from "@/components/parents/parent-first-student-form";
import { ParentSummaryCard } from "@/components/parents/parent-summary-card";
import { PageHeader } from "@/components/shared/page-header";
import { parentService } from "@/services/parentService";

type Props = { params: Promise<{ id: string }> };

export default async function ParentStudentCreatePage({ params }: Props) {
  const { id } = await params;
  const parent = await parentService.getById(id);
  if (!parent) notFound();

  return (
    <>
      <PageHeader
        title="Registrar estudiante"
        description="Complete los datos del estudiante. Se creará automáticamente el vínculo en parent_students."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Padres", href: "/dashboard/parents" },
          { label: parent.fullName, href: `/dashboard/parents/${id}` },
          { label: "Nuevo estudiante" },
        ]}
      />
      <ParentSummaryCard parent={parent} />
      <ParentFirstStudentForm parent={parent} />
    </>
  );
}
