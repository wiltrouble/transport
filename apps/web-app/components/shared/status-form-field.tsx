"use client";

import type { FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { Select } from "@/components/ui/select";

type StatusFormFieldProps<T extends FieldValues> = {
  id: string;
  label?: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  error?: string;
};

/** Boolean status field (Appwrite attribute type: boolean). */
export function StatusFormField<T extends FieldValues>({
  id,
  label = "Estado",
  name,
  watch,
  setValue,
  error,
}: StatusFormFieldProps<T>) {
  const value = watch(name);
  const selected = value === true || value === "true" ? "true" : "false";

  return (
    <FormField label={label} htmlFor={id} error={error}>
      <Select
        id={id}
        value={selected}
        onChange={(e) =>
          setValue(name, (e.target.value === "true") as T[Path<T>], {
            shouldValidate: true,
          })
        }
      >
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </Select>
    </FormField>
  );
}
