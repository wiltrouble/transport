import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignRelationshipForm } from "@/components/relationships/assign-relationship-form";
import { ParentStudentsTable } from "@/components/parents/parent-students-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { parentService } from "@/services/parentService";
import { studentService } from "@/services/studentService";

type Props = { params: Promise<{ id: string }> };

export default async function ParentDetailPage({ params }: Props) {
  const { id } = await params;
  const parent = await parentService.getByIdWithStudents(id);
  if (!parent) notFound();

  const students = await studentService.listAllActive();
  const linkedStudentIds = new Set(parent.assignments.map((a) => a.studentId));
  const availableStudents = students.filter((s) => !linkedStudentIds.has(s.id));

  return (
    <>
      <PageHeader
        title={parent.fullName}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Padres", href: "/dashboard/parents" },
          { label: parent.fullName },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/parents/${id}/students/create`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Agregar estudiante
            </Link>
            <Link
              href={`/dashboard/parents/${id}/edit`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Editar
            </Link>
          </div>
        }
      />

      <Card className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Correo</p>
          <p className="mt-1 text-slate-900">{parent.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Teléfono</p>
          <p className="mt-1 text-slate-900">{parent.phone}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Emergencia</p>
          <p className="mt-1 text-slate-900">{parent.emergencyPhone}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
          <div className="mt-1">
            <StatusBadge status={parent.status} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase text-slate-500">Dirección</p>
          <p className="mt-1 text-slate-900">{parent.address}</p>
        </div>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Estudiantes vinculados</h2>
      <div className="mb-8">
        <ParentStudentsTable parentId={id} assignments={parent.assignments} />
      </div>

      {availableStudents.length > 0 ? (
        <>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Vincular estudiante existente</h2>
          <p className="mb-4 text-sm text-slate-600">
            Si el estudiante ya está en el sistema, asígnelo sin crear un registro nuevo.
          </p>
          <AssignRelationshipForm
            mode="parent"
            entityId={id}
            assignments={parent.assignments}
            parents={[]}
            students={availableStudents}
            assignOnly
          />
        </>
      ) : null}
    </>
  );
}
