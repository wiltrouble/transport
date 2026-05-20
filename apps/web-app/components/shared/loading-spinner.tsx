import { Spinner } from "@/components/ui/spinner";

type LoadingSpinnerProps = {
  label?: string;
};

export function LoadingSpinner({ label = "Cargando…" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-600">
      <Spinner />
      {label}
    </div>
  );
}
