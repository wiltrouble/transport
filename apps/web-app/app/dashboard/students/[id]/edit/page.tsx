import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StudentForm } from "@/components/students/student-form";
import { studentService } from "@/services/studentService";

type Props = { params: Promise<{ id: string }> };

export default async function EditStudentPage({ params }: Props) {
  const { id } = await params;
  const student = await studentService.getById(id);
  if (!student) notFound();

  return (
    <>
      <PageHeader
        title={`Editar: ${student.fullName}`}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Estudiantes", href: "/dashboard/students" },
          { label: student.fullName, href: `/dashboard/students/${id}` },
          { label: "Editar" },
        ]}
      />
      <StudentForm mode="edit" student={student} />
    </>
  );
}
