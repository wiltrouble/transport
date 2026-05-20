"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, GraduationCap, LayoutDashboard, MapPin, Route, Users } from "lucide-react";
import { cn } from "@school/utils";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/parents", label: "Padres", icon: Users },
  { href: "/dashboard/students", label: "Estudiantes", icon: GraduationCap },
  { href: "/dashboard/drivers", label: "Conductores", icon: Users },
  { href: "/dashboard/vehicles", label: "Vehículos", icon: Car },
  { href: "/dashboard/sessions", label: "Sesiones", icon: Route },
  { href: "/dashboard/live-map", label: "Mapa en vivo", icon: MapPin },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Transporte escolar</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">Panel administrativo</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
