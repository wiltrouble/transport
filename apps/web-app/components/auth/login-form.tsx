"use client";

import { AppwriteException } from "appwrite";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserAccount, getBrowserAppwriteClient, clearBrowserAppwriteSession } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

/**
 * With some bundlers, `instanceof AppwriteException` can be false even for real
 * Appwrite errors (duplicate module instances). We also handle network/config errors.
 */
function isAppwriteAuthError(
  error: unknown,
): error is AppwriteException | (Error & { code: number }) {
  if (error instanceof AppwriteException) {
    return true;
  }
  if (
    error instanceof Error &&
    error.name === "AppwriteException" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "number"
  ) {
    return true;
  }
  return false;
}

function mapLoginError(error: unknown): string {
  if (process.env.NODE_ENV === "development") {
    console.error("[login]", error);
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "No se pudo conectar con Appwrite. Compruebe la red, el endpoint y que su dominio (p. ej. localhost:3000) esté registrado como plataforma «Web» en Appwrite.";
  }

  if (error instanceof Error && error.message.includes("NEXT_PUBLIC_APPWRITE")) {
    return "Falta la configuración de Appwrite. Copie env.local.template a .env.local y reinicie el servidor de desarrollo.";
  }

  if (isAppwriteAuthError(error)) {
    const code = error instanceof AppwriteException ? error.code : (error as { code: number }).code;
    const message =
      error instanceof AppwriteException
        ? error.message
        : (error as Error).message;

    const lower = message.toLowerCase();
    // Appwrite rejects a second `createEmailPasswordSession` while a session exists.
    if (
      lower.includes("session is active") ||
      lower.includes("session is prohibited") ||
      (lower.includes("session") && lower.includes("prohibited"))
    ) {
      return "Ya hay una sesión activa en este navegador. Espere unos segundos, recargue la página o cierre sesión antes de volver a entrar.";
    }

    // Wrong email/password is usually 401; some responses use 400 for validation errors.
    if (code === 401) {
      return "Correo o contraseña incorrectos.";
    }
    if (code === 400) {
      return message || "Solicitud no válida. Compruebe los datos e inténtelo de nuevo.";
    }

    if (code === 403 || message.includes("Invalid Origin") || message.includes("new client")) {
      return "Appwrite rechazó el origen de la petición. En el panel de Appwrite → Settings → Platforms, añada «Web» con el mismo host que usa en el navegador (p. ej. http://localhost:3000).";
    }

    if (code === 429) {
      return "Demasiados intentos. Espere un momento e inténtelo de nuevo.";
    }

    return message || "No se pudo iniciar sesión.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo iniciar sesión. Inténtelo de nuevo.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await clearBrowserAppwriteSession();
      const account = getBrowserAccount();
      const session = await account.createEmailPasswordSession({
        email: email.trim(),
        password,
      });

      // Persist secret on the Appwrite client for follow-up SDK calls in the browser.
      const secret =
        typeof session.secret === "string" && session.secret.length > 0
          ? session.secret
          : null;

      let syncBody: Record<string, string>;
      if (secret) {
        getBrowserAppwriteClient().setSession(secret);
        syncBody = { secret, expire: session.expire };
      } else {
        // Appwrite Cloud often omits `secret` in the JSON body; session is carried via
        // `X-Fallback-Cookies` / localStorage instead (see Appwrite web SDK).
        const fallback =
          typeof window !== "undefined"
            ? window.localStorage.getItem("cookieFallback")
            : null;
        if (!fallback?.length) {
          setError(
            "Appwrite no devolvió el secreto de sesión ni datos de respaldo (cookieFallback). Añada una clave API de servidor (APPWRITE_API_KEY) o consulte la documentación de Appwrite para sesiones en SSR.",
          );
          setLoading(false);
          return;
        }
        syncBody = { fallbackCookies: fallback, expire: session.expire };
      }

      const sync = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncBody),
        credentials: "include",
      });

      if (!sync.ok) {
        const body = (await sync.json().catch(() => null)) as {
          error?: string;
          code?: string;
        } | null;

        // When the server rejected us for not being an admin, the API has
        // already revoked the Appwrite session — make sure the browser SDK
        // mirrors that so a subsequent attempt does not say "session active".
        if (sync.status === 403 || body?.code === "FORBIDDEN_ROLE") {
          await clearBrowserAppwriteSession().catch(() => undefined);
        }

        setError(body?.error || "No se pudo guardar la sesión en el servidor.");
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(mapLoginError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg shadow-slate-200/80">
      <div className="mb-6 space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME ?? "school-transport"}
        </p>
        <CardTitle className="text-balance text-xl sm:text-2xl">
          Sistema de Gestión de Transporte Escolar
        </CardTitle>
        <p className="text-sm text-slate-500">Inicie sesión para continuar</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="nombre@escuela.edu"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <Label htmlFor="password" className="mb-0">
              Contraseña
            </Label>
            <button
              type="button"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
        </div>

        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full py-3 text-base"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner tone="onPrimary" />
              Iniciando sesión…
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
    </Card>
  );
}
