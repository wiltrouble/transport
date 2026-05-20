import { Redirect } from "expo-router";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  if (!isHydrated) {
    return (
      <View className="flex-1 gap-3 bg-slate-50 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </View>
    );
  }

  if (!user || !role) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === "driver") {
    return <Redirect href="/(driver)" />;
  }

  if (role === "parent") {
    return <Redirect href="/(parent)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
