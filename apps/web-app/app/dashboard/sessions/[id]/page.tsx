import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceSummary } from "@/components/sessions/attendance-summary";
import { SessionActions } from "@/components/sessions/session-actions";
import { SessionHeader } from "@/components/sessions/session-header";
import { StudentSessionStatusBadge } from "@/components/sessions/student-session-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { formatDateTime } from "@school/utils";
import { transportSessionService } from "@/services/transportSessionService";

type Props = { params: Promise<{ id: string }> };

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await transportSessionService.getByIdWithDetails(id);
  if (!session) notFound();

  return (
    <>
      <PageHeader
        title={`Sesión ${session.vehicle?.plate ?? id}`}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Sesiones", href: "/dashboard/sessions" },
          { label: session.vehicle?.plate ?? "Detalle" },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/sessions/${id}/manage`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Gestionar asistencia
            </Link>
            <SessionActions
              sessionId={id}
              status={session.status}
              manageHref={`/dashboard/sessions/${id}/manage`}
            />
          </div>
        }
      />

      <SessionHeader session={session} />

      <AttendanceSummary {...session.summary} />

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Estudiantes</h2>
      <DataTable
        columns={[
          { key: "order", header: "Orden", cell: (r) => r.pickupOrder },
          {
            key: "name",
            header: "Estudiante",
            cell: (r) => r.student?.fullName ?? r.studentId,
          },
          { key: "grade", header: "Grado", cell: (r) => r.student?.grade ?? "—" },
          {
            key: "status",
            header: "Estado",
            cell: (r) => <StudentSessionStatusBadge status={r.status} />,
          },
          {
            key: "pickup",
            header: "Recogida",
            cell: (r) => formatDateTime(r.pickupTime || null),
          },
          {
            key: "dropoff",
            header: "Entrega",
            cell: (r) => formatDateTime(r.dropoffTime || null),
          },
        ]}
        data={session.students}
        keyExtractor={(r) => r.id}
        emptyMessage="Sin estudiantes en esta sesión"
      />
    </>
  );
}
