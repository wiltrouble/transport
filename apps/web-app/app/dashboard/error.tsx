"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="text-lg font-semibold text-red-900">Algo salió mal</h2>
      <p className="mt-2 text-sm text-red-800">{error.message}</p>
      <Button className="mt-4" onClick={reset}>Reintentar</Button>
    </div>
  );
}
