import { cn } from "@school/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-lg bg-slate-200/80 motion-safe:animate-pulse", className)}
      aria-hidden
    />
  );
}
