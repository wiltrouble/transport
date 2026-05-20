import { cn } from "@school/utils";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50";
  const styles = {
    primary:
      "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-700",
    secondary:
      "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  }[variant];

  return (
    <button type={type} className={cn(base, styles, className)} {...props} />
  );
}
