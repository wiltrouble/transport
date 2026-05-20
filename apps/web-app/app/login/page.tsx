import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Transporte Escolar",
  description: "Acceso al sistema de gestión de transporte escolar",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-12">
      <LoginForm />
    </div>
  );
}
