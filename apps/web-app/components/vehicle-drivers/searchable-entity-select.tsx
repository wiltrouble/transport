"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type SearchableOption = {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type SearchableEntitySelectProps = {
  id: string;
  label: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  error?: string;
};

export function SearchableEntitySelect({
  id,
  label,
  placeholder = "Buscar…",
  options,
  value,
  onChange,
  disabled,
  error,
}: SearchableEntitySelectProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, search]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <Input
        id={`${id}-search`}
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
        className="mb-2"
      />
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Seleccionar…</option>
        {filtered.map((o) => (
          <option key={o.id} value={o.id} disabled={o.disabled}>
            {o.disabled
              ? `${o.hint ? `${o.label} — ${o.hint}` : o.label} (no disponible)`
              : o.hint
                ? `${o.label} — ${o.hint}`
                : o.label}
          </option>
        ))}
      </Select>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
