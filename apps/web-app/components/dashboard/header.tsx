import { getAuthenticatedUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export async function DashboardHeader() {
  const user = await getAuthenticatedUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <p className="truncate text-sm text-slate-600">
        {user?.email ? <>Sesión: <span className="font-medium text-slate-900">{user.email}</span></> : "Administración"}
      </p>
      <LogoutButton />
    </header>
  );
}
