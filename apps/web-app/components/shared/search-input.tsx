"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@school/utils";

type SearchInputProps = {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (value: string) => void;
  className?: string;
};

export function SearchInput({
  placeholder = "Buscar…",
  defaultValue = "",
  onSearch,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <Input
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="pl-9"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch((e.target as HTMLInputElement).value);
        }}
      />
    </div>
  );
}
