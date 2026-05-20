"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  cancelTransportSessionAction,
  completeTransportSessionAction,
} from "@/app/actions/transport-sessions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { TransportSessionStatus } from "@school/utils";

type SessionActionsProps = {
  sessionId: string;
  status: TransportSessionStatus | string;
  manageHref?: string;
};

/**
 * Lifecycle controls for an existing session. The "start" action is gone —
 * sessions are created in the `active` state from the vehicle operational
 * dashboard, so this component only handles the `active → completed/cancelled`
 * transitions plus a shortcut to the manage view.
 *
 * Legacy `pending` rows from the old workflow are surfaced with a notice that
 * routes the operator back to the dashboard to start a new session for the
 * vehicle instead.
 */
export function SessionActions({ sessionId, status, manageHref }: SessionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<"complete" | "cancel" | null>(null);

  async function handleConfirm() {
    if (!confirm) return;
    setLoading(true);
    const res =
      confirm === "complete"
        ? await completeTransportSessionAction(sessionId)
        : await cancelTransportSessionAction(sessionId);
    setLoading(false);
    setConfirm(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(confirm === "complete" ? "Sesión completada" : "Sesión cancelada");
    router.refresh();
  }

  return (
    <>
      {status === "pending" ? (
        <Link
          href="/dashboard/sessions"
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          Sesión heredada — iniciar desde el vehículo
        </Link>
      ) : null}
      {status === "active" ? (
        <>
          {manageHref ? (
            <Link href={manageHref}>
              <Button type="button" variant="secondary">
                Gestionar asistencia
              </Button>
            </Link>
          ) : null}
          <Button
            type="button"
            disabled={loading}
            onClick={() => setConfirm("complete")}
          >
            Completar
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-red-600"
            disabled={loading}
            onClick={() => setConfirm("cancel")}
          >
            Cancelar
          </Button>
        </>
      ) : null}

      <ConfirmDialog
        open={confirm === "complete"}
        title="Completar sesión"
        description="La sesión quedará en solo lectura. ¿Desea finalizar el viaje?"
        confirmLabel="Completar"
        loading={loading}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        title="Cancelar sesión"
        description="¿Confirma cancelar esta sesión de transporte?"
        confirmLabel="Cancelar sesión"
        variant="danger"
        loading={loading}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
