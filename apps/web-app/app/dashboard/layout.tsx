import { Suspense } from "react";
import { requireAdmin } from "@/lib/authorization";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { AuthLoading } from "@/components/auth/auth-loading";

export const dynamic = "force-dynamic";

async function DashboardAuth({ children }: { children: React.ReactNode }) {
  // Server-side, request-time authorization check — runs on every dashboard
  // render. Redirects to /login (no session) or /unauthorized (wrong role).
  await requireAdmin();
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <DashboardAuth>
        <div className="flex min-h-screen bg-slate-50">
          <DashboardSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Suspense fallback={<div className="h-14 border-b border-slate-200 bg-white" />}>
              <DashboardHeader />
            </Suspense>
            <main className="flex-1 overflow-auto p-4 text-slate-900 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
        <ToasterProvider />
      </DashboardAuth>
    </Suspense>
  );
}
