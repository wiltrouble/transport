"use client";

import { Check, Copy, Eye, EyeOff, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ProvisioningCredentials } from "@/lib/provisioning/types";

type ProvisioningRole = "driver" | "parent";

const roleCopy: Record<
  ProvisioningRole,
  {
    title: string;
    subject: string;
    mobileHint: string;
    primaryLabel: string;
    createAnotherLabel: string;
  }
> = {
  driver: {
    title: "Conductor creado",
    subject: "conductor",
    mobileHint: "El conductor debe usar la app móvil con estas credenciales.",
    primaryLabel: "Ver conductor",
    createAnotherLabel: "Crear otro",
  },
  parent: {
    title: "Padre/madre creado",
    subject: "responsable",
    mobileHint: "El padre/madre puede iniciar sesión en la app móvil con estas credenciales.",
    primaryLabel: "Ver perfil",
    createAnotherLabel: "Crear otro",
  },
};

type ProvisioningCredentialsDialogProps = {
  open: boolean;
  credentials: ProvisioningCredentials | null;
  role: ProvisioningRole;
  personName?: string;
  onPrimary: () => void;
  onCreateAnother?: () => void;
  extraAction?: { label: string; onClick: () => void };
};

type CopyField = "email" | "password" | "all";

/**
 * Copies the raw value of a field to the clipboard. We never embed labels or
 * separators here so the admin cannot accidentally paste leading/trailing
 * whitespace into the mobile login (a frequent cause of "invalid credentials"
 * errors right after provisioning).
 */
async function writeToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function ProvisioningCredentialsDialog({
  open,
  credentials,
  role,
  personName,
  onPrimary,
  onCreateAnother,
  extraAction,
}: ProvisioningCredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const copy = roleCopy[role];

  useEffect(() => {
    if (!open) {
      setPasswordVisible(false);
      setCopiedField(null);
    }
  }, [open]);

  if (!open || !credentials) return null;

  async function handleCopy(field: CopyField, value: string, label: string) {
    const ok = await writeToClipboard(value);
    if (!ok) {
      toast.error("No se pudo copiar. Copie los datos manualmente.");
      return;
    }
    setCopiedField(field);
    toast.success(`${label} copiado al portapapeles`);
    window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 2000);
  }

  const allCredentials = `Correo: ${credentials.email}\nContraseña temporal: ${credentials.temporaryPassword}`;
  const maskedPassword = "•".repeat(Math.min(credentials.temporaryPassword.length, 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Cerrar"
        onClick={onPrimary}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provisioning-credentials-title"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Check className="size-6" aria-hidden />
          </div>
          <div>
            <h2 id="provisioning-credentials-title" className="text-lg font-semibold text-slate-900">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {personName
                ? `${personName} puede iniciar sesión en la app móvil.`
                : `Comparta las credenciales con el ${copy.subject}.`}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-900">
            Credenciales temporales (solo se muestran una vez)
          </p>

          <div>
            <p className="text-xs text-amber-800">Correo</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="flex-1 truncate font-mono text-sm font-semibold text-slate-900">
                {credentials.email}
              </p>
              <button
                type="button"
                onClick={() => handleCopy("email", credentials.email, "Correo")}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-500"
                aria-label="Copiar correo"
              >
                {copiedField === "email" ? (
                  <>
                    <Check className="size-3.5" aria-hidden />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-800">Contraseña temporal</p>
              <button
                type="button"
                onClick={() => setPasswordVisible((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-500"
                aria-pressed={passwordVisible}
              >
                {passwordVisible ? (
                  <>
                    <EyeOff className="size-3.5" aria-hidden />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" aria-hidden />
                    Mostrar
                  </>
                )}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p
                className={`flex-1 break-all font-mono text-sm font-semibold text-slate-900 ${
                  passwordVisible ? "" : "select-none tracking-widest"
                }`}
              >
                {passwordVisible ? credentials.temporaryPassword : maskedPassword}
              </p>
              <button
                type="button"
                onClick={() =>
                  handleCopy("password", credentials.temporaryPassword, "Contraseña")
                }
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-500"
                aria-label="Copiar contraseña"
              >
                {copiedField === "password" ? (
                  <>
                    <Check className="size-3.5" aria-hidden />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-amber-800">
              Use el botón &quot;Copiar&quot; — copiar manualmente puede agregar espacios
              invisibles que harán fallar el inicio de sesión.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
          <p>
            {copy.mobileHint} La contraseña no se almacena en la base de datos; Appwrite Auth la
            gestiona.
          </p>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Próximamente: envío automático por correo electrónico o WhatsApp.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleCopy("all", allCredentials, "Credenciales")}
          >
            {copiedField === "all" ? (
              <>
                <Check className="size-4" aria-hidden />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden />
                Copiar ambas
              </>
            )}
          </Button>
          {onCreateAnother ? (
            <Button type="button" variant="secondary" onClick={onCreateAnother}>
              {copy.createAnotherLabel}
            </Button>
          ) : null}
          {extraAction ? (
            <Button type="button" variant="secondary" onClick={extraAction.onClick}>
              {extraAction.label}
            </Button>
          ) : null}
          <Button type="button" onClick={onPrimary}>
            {copy.primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
