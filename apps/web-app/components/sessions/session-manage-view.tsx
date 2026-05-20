"use client";

import { SessionActions } from "@/components/sessions/session-actions";
import { SessionHeader } from "@/components/sessions/session-header";
import { AttendanceSummary } from "@/components/sessions/attendance-summary";
import { StudentAttendanceCard } from "@/components/sessions/student-attendance-card";
import { EmptyState } from "@/components/shared/empty-state";
import { isSessionEditable } from "@school/utils";
import type { TransportSessionWithDetails } from "@school/types";

type SessionManageViewProps = {
  session: TransportSessionWithDetails;
};

export function SessionManageView({ session }: SessionManageViewProps) {
  const readOnly = !isSessionEditable(session.status);

  return (
    <>
      <SessionHeader
        session={session}
        sticky
        actions={
          <SessionActions
            sessionId={session.id}
            status={session.status}
          />
        }
      />

      <AttendanceSummary {...session.summary} />

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Lista de estudiantes</h2>

      {session.students.length === 0 ? (
        <EmptyState
          title="Sin estudiantes en la sesión"
          description="No hay estudiantes activos asignados al vehículo en vehicle_students."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {session.students.map((student) => (
            <StudentAttendanceCard
              key={student.id}
              student={student}
              sessionId={session.id}
              sessionStatus={session.status}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </>
  );
}
