import { cn } from "@school/utils";
import type { HTMLAttributes } from "react";

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold tracking-tight text-slate-900", className)}
      {...props}
    />
  );
}
