import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

/**
 * Shared screens for any authenticated mobile user (driver OR parent).
 *
 * Anything inside `app/(shared)` requires an active session. Admins are not
 * allowed on the mobile app at all — `useAuthStore` already rejects them at
 * login/hydrate, so a non-null `role` here always means `driver` or `parent`.
 */
export default function SharedLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  if (!isHydrated) return null;
  if (!user || !role) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
