import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  if (user && role === "driver") {
    return <Redirect href="/(driver)" />;
  }
  if (user && role === "parent") {
    return <Redirect href="/(parent)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
