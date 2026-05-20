"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  markAbsentAction,
  markBoardedAction,
  markDroppedOffAction,
  updateSessionStudentNotesAction,
} from "@/app/actions/session-students";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_STUDENT_STATUS_LABELS } from "@school/utils";
import { formatDateTime } from "@school/utils";
import type { SessionStudent } from "@school/types";
import type { TransportSessionStatus } from "@school/utils";

type StudentAttendanceCardProps = {
  student: SessionStudent;
  sessionId: string;
  sessionStatus: TransportSessionStatus | string;
  readOnly?: boolean;
};

export function StudentAttendanceCard({
  student,
  sessionId,
  sessionStatus,
  readOnly = false,
}: StudentAttendanceCardProps) {
  const [notes, setNotes] = useState(student.notes);
  const [loading, setLoading] = useState(false);

  const editable =
    !readOnly && (sessionStatus === "active" || sessionStatus === "pending");
  const statusLabel =
    SESSION_STUDENT_STATUS_LABELS[
      student.status as keyof typeof SESSION_STUDENT_STATUS_LABELS
    ] ?? student.status;

  function actionErrorMessage(error: unknown): string {
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "notes" in error) {
      const notes = (error as { notes?: string[] }).notes;
      if (notes?.[0]) return notes[0];
    }
    return "Error al guardar";
  }

  async function run(
    action: () => Promise<{ ok: boolean; error?: unknown }>,
    success: string,
  ) {
    setLoading(true);
    const res = await action();
    setLoading(false);
    if (!res.ok) {
      toast.error(actionErrorMessage(res.error));
      return;
    }
    toast.success(success);
  }

  async function saveNotes() {
    await run(
      () =>
        updateSessionStudentNotesAction(student.id, sessionId, { notes }),
      "Notas guardadas",
    );
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-indigo-600">
            Orden #{student.pickupOrder}
          </p>
          <h3 className="mt-1 font-semibold text-slate-900">
            {student.student?.fullName ?? student.studentId}
          </h3>
          <p className="text-sm text-slate-600">
            {student.student?.grade ? `Grado ${student.student.grade}` : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="default">{statusLabel}</Badge>
            {student.pickupTime ? (
              <span className="text-xs text-slate-500">
                Recogida: {formatDateTime(student.pickupTime)}
              </span>
            ) : null}
            {student.dropoffTime ? (
              <span className="text-xs text-slate-500">
                Entrega: {formatDateTime(student.dropoffTime)}
              </span>
            ) : null}
          </div>
        </div>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
             
              disabled={loading || student.boarded}
              onClick={() =>
                void run(
                  () => markBoardedAction(student.id, sessionId),
                  "Marcado como abordado",
                )
              }
            >
              Abordó
            </Button>
            <Button
              type="button"
             
              variant="secondary"
              disabled={loading || student.droppedOff}
              onClick={() =>
                void run(
                  () => markDroppedOffAction(student.id, sessionId),
                  "Marcado como entregado",
                )
              }
            >
              Entregado
            </Button>
            <Button
              type="button"
             
              variant="ghost"
              className="text-amber-700"
              disabled={loading || student.absent}
              onClick={() =>
                void run(
                  () => markAbsentAction(student.id, sessionId),
                  "Marcado como ausente",
                )
              }
            >
              Ausente
            </Button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 space-y-2">
        <label className="text-xs font-medium text-slate-500" htmlFor={`notes-${student.id}`}>
          Notas operativas
        </label>
        <Textarea
          id={`notes-${student.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!editable || loading}
          rows={2}
          placeholder="Observaciones del viaje…"
        />
        {editable ? (
          <Button
            type="button"
            variant="secondary"
           
            disabled={loading}
            onClick={() => void saveNotes()}
          >
            Guardar notas
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
