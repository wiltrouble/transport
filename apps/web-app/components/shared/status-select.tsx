import { Select } from "@/components/ui/select";
import type { SelectHTMLAttributes } from "react";

type StatusSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">;

/** Select bound to boolean status (true = active, false = inactive). */
export function StatusSelect(props: StatusSelectProps) {
  return (
    <Select {...props}>
      <option value="true">Activo</option>
      <option value="false">Inactivo</option>
    </Select>
  );
}

/** For react-hook-form: maps "true"/"false" option values to boolean. */
export const statusSelectRegisterOptions = {
  setValueAs: (v: string) => v === "true",
} as const;
