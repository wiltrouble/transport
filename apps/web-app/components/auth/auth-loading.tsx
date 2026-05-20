import { Spinner } from "@/components/ui/spinner";

/**
 * Shown while the server resolves the Appwrite session (Suspense fallback on `/`).
 */
export function AuthLoading() {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3">
      <Spinner className="text-slate-600" />
      <p className="text-sm text-slate-500">Verificando sesión…</p>
    </div>
  );
}
