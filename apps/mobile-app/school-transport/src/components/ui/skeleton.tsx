import { View, type ViewProps } from "react-native";

export function Skeleton({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={`animate-pulse rounded-2xl bg-slate-200 ${className ?? ""}`} {...props} />;
}
