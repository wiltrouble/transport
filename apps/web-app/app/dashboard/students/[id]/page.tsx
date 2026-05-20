import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignRelationshipForm } from "@/components/relationships/assign-relationship-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { StudentAssignmentStatusBadge } from "@/components/vehicle-students/student-assignment-status-badge";
import { VehicleStudentAssignmentsList } from "@/components/vehicle-students/vehicle-student-assignments-list";
import { GENDER_LABELS } from "@school/utils";
import { formatDate } from "@school/utils";
import { getStudentPhotoUrl } from "@/lib/storage-url";
import { parentService } from "@/services/parentService";
import { parentStudentService } from "@/services/parentStudentService";
import { studentService } from "@/services/studentService";
import { vehicleStudentService } from "@/services/vehicleStudentService";

type Props = { params: Promise<{ id: string }> };

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const [student, parentAssignments, vehicleAssignmentHistory, currentVehicleAssignment, parents] =
    await Promise.all([
      studentService.getById(id),
      parentStudentService.listByStudentId(id),
      vehicleStudentService.listByStudentId(id),
      vehicleStudentService.getStudentCurrentVehicle(id),
      parentService.listAllActive(),
    ]);
  if (!student) notFound();

  const photoUrl = getStudentPhotoUrl(student.photo);
  const current = currentVehicleAssignment;
  const currentVehicle = current?.vehicle;

  return (
    <>
      <PageHeader
        title={student.fullName}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Estudiantes", href: "/dashboard/students" },
          { label: student.fullName },
        ]}
        actions={
          <Link
            href={`/dashboard/students/${id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Editar
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {photoUrl ? (
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-slate-200">
              <Image
                src={photoUrl}
                alt={student.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Grado</p>
              <p className="mt-1 text-slate-900">{student.grade}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Género</p>
              <p className="mt-1 text-slate-900">{GENDER_LABELS[student.gender]}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Nacimiento</p>
              <p className="mt-1 text-slate-900">{formatDate(student.birthDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Estado</p>
              <div className="mt-1">
                <StatusBadge status={student.status} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase text-slate-500">Dirección</p>
              <p className="mt-1 text-slate-900">{student.address}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Transporte asignado</h2>
        {current && currentVehicle ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Vehículo</p>
              <Link
                href={`/dashboard/vehicles/${current.vehicleId}`}
                className="mt-1 block font-medium text-indigo-600 hover:underline"
              >
                {currentVehicle.plate}
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Marca / modelo</p>
              <p className="mt-1 text-slate-900">
                {currentVehicle.brand} {currentVehicle.model}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Orden de recogida</p>
              <p className="mt-1 text-slate-900">#{current.pickupOrder}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Horario</p>
              <p className="mt-1 text-slate-900">
                {current.pickupTime || "—"} → {current.dropoffTime || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Estado asignación</p>
              <div className="mt-1">
                <StudentAssignmentStatusBadge assignment={current} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Sin vehículo activo. Asigne este estudiante desde{" "}
            <Link href="/dashboard/vehicles" className="font-medium text-indigo-600 hover:underline">
              la ruta de un vehículo
            </Link>
            .
          </p>
        )}
      </Card>

      {vehicleAssignmentHistory.length > 0 ? (
        <div className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial de transporte</h2>
          <VehicleStudentAssignmentsList
            assignments={vehicleAssignmentHistory}
            showVehicle
            showStudent={false}
            emptyTitle="Sin historial"
          />
        </div>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Padres vinculados</h2>
      <AssignRelationshipForm
        mode="student"
        entityId={id}
        assignments={parentAssignments}
        parents={parents}
        students={[]}
      />
    </>
  );
}
