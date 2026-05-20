import { notFound } from "next/navigation";
import { ParentForm } from "@/components/parents/parent-form";
import { PageHeader } from "@/components/shared/page-header";
import { parentService } from "@/services/parentService";

type Props = { params: Promise<{ id: string }> };

export default async function EditParentPage({ params }: Props) {
  const { id } = await params;
  const parent = await parentService.getById(id);
  if (!parent) notFound();

  return (
    <>
      <PageHeader
        title={`Editar: ${parent.fullName}`}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Padres", href: "/dashboard/parents" },
          { label: parent.fullName, href: `/dashboard/parents/${id}` },
          { label: "Editar" },
        ]}
      />
      <ParentForm mode="edit" parent={parent} />
    </>
  );
}
