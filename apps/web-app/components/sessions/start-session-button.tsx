"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { startVehicleSessionAction } from "@/app/actions/transport-sessions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type StartSessionButtonProps = {
  vehicleId: string;
  /**
   * Where to navigate after a successful start. Defaults to the session
   * manage view for the new session.
   */
  redirectTo?: (sessionId: string) => string;
  label?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

/**
 * Single-click vehicle session starter. The vehicle is the operational unit:
 * the server inherits driver, students and shift from the vehicle state, so
 * the UI exposes no extra fields.
 */
export function StartSessionButton({
  vehicleId,
  redirectTo,
  label = "Iniciar sesión",
  variant = "primary",
  className,
}: StartSessionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await startVehicleSessionAction(vehicleId);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Sesión iniciada. Estudiantes cargados.");
    const path = redirectTo
      ? redirectTo(res.id)
      : `/dashboard/sessions/${res.id}/manage`;
    router.push(path);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => void handleClick()}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Spinner tone={variant === "primary" ? "onPrimary" : "default"} />
          Iniciando…
        </>
      ) : (
        label
      )}
    </Button>
  );
}
