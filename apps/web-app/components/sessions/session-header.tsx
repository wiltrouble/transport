import Link from "next/link";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { Button } from "@/components/ui/button";
import { SESSION_SHIFT_LABELS } from "@school/utils";
import { formatDate, formatDateTime } from "@school/utils";
import type { TransportSession } from "@school/types";

type SessionHeaderProps = {
  session: TransportSession;
  actions?: React.ReactNode;
  sticky?: boolean;
};

export function SessionHeader({ session, actions, sticky = false }: SessionHeaderProps) {
  const shiftLabel =
    SESSION_SHIFT_LABELS[session.shift as keyof typeof SESSION_SHIFT_LABELS] ??
    session.shift;

  return (
    <div
      className={
        sticky
          ? "sticky top-0 z-10 -mx-4 mb-6 border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          : "mb-6"
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge status={session.status} />
            <span className="text-sm text-slate-500">{formatDate(session.sessionDate)}</span>
            <span className="text-sm text-slate-500">· {shiftLabel}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            {session.vehicle?.plate ?? session.vehicleId}
            <span className="font-normal text-slate-500">
              {" "}
              — {session.driver?.fullName ?? session.driverId}
            </span>
          </h1>
          <p className="text-sm text-slate-600">
            {session.vehicle
              ? `${session.vehicle.brand} ${session.vehicle.model}`
              : null}
            {session.startTime ? (
              <> · Inicio {formatDateTime(session.startTime)}</>
            ) : null}
            {session.endTime ? <> · Fin {formatDateTime(session.endTime)}</> : null}
          </p>
          {session.notes ? (
            <p className="text-sm text-slate-500">{session.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {actions}
          <Link href={`/dashboard/sessions/${session.id}`}>
            <Button type="button" variant="secondary">
              Ver detalle
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
