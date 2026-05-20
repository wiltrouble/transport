import Link from "next/link";
import { Suspense } from "react";
import { Car, GraduationCap, MapPin, Route, Users } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatsSkeleton() {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Inicio" description="Resumen del sistema de transporte escolar" />
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/parents">
          <Card className="flex items-center gap-4 transition hover:shadow-md">
            <Users className="size-10 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">Padres</h2>
              <p className="text-sm text-slate-500">Responsables y tutores</p>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/students">
          <Card className="flex items-center gap-4 transition hover:shadow-md">
            <GraduationCap className="size-10 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">Estudiantes</h2>
              <p className="text-sm text-slate-500">Registro y fotos</p>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/drivers">
          <Card className="flex items-center gap-4 transition hover:shadow-md">
            <Users className="size-10 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">Conductores</h2>
              <p className="text-sm text-slate-500">Licencias y asignación</p>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/vehicles">
          <Card className="flex items-center gap-4 transition hover:shadow-md">
            <Car className="size-10 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">Vehículos</h2>
              <p className="text-sm text-slate-500">Flota y rutas diarias</p>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/sessions">
          <Card className="flex items-center gap-4 transition hover:shadow-md">
            <Route className="size-10 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">Operación</h2>
              <p className="text-sm text-slate-500">Inicia sesiones por vehículo</p>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/live-map">
          <Card className="flex items-center gap-4 transition hover:shadow-md">
            <MapPin className="size-10 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">Mapa en vivo</h2>
              <p className="text-sm text-slate-500">Seguimiento GPS en tiempo real</p>
            </div>
          </Card>
        </Link>
      </div>
    </>
  );
}
