"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearBrowserAppwriteSession, getBrowserAppwriteClient } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";

/**
 * Calls the logout API (Appwrite deleteSession + clears HttpOnly cookie), then clears
 * any browser-side Appwrite session state and returns the user to `/login`.
 */
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Still clear local state if the network request fails.
    } finally {
      await clearBrowserAppwriteSession();
      router.replace("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => void logout()}
      disabled={loading}
    >
      {loading ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}
