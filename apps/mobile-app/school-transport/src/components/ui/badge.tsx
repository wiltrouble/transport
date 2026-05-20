import { Text, View } from "react-native";

const toneClasses = {
  default: "bg-slate-100",
  success: "bg-emerald-100",
  warning: "bg-amber-100",
  danger: "bg-red-100",
  info: "bg-blue-100",
};

const textClasses = {
  default: "text-slate-700",
  success: "text-emerald-800",
  warning: "text-amber-900",
  danger: "text-red-800",
  info: "text-blue-800",
};

type BadgeProps = {
  label: string;
  tone?: keyof typeof toneClasses;
};

export function Badge({ label, tone = "default" }: BadgeProps) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${toneClasses[tone]}`}>
      <Text className={`text-xs font-semibold ${textClasses[tone]}`}>{label}</Text>
    </View>
  );
}
