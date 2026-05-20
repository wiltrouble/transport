import { cn } from "@school/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
  /** `onPrimary`: high-contrast spinner for dark / primary buttons */
  tone?: "default" | "onPrimary";
};

/**
 * Accessible inline spinner for loading states (forms, Suspense fallbacks).
 */
export function Spinner({
  className,
  label = "Cargando…",
  tone = "default",
}: SpinnerProps) {
  const ring =
    tone === "onPrimary"
      ? "border-white/30 border-t-white"
      : "border-slate-200 border-t-indigo-600";
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm text-slate-500", className)}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "size-5 shrink-0 rounded-full border-2 motion-safe:animate-spin",
          ring,
        )}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
