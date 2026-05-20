import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type ButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
};

const variantClasses = {
  primary: "bg-brand-600 active:bg-brand-700",
  secondary: "bg-slate-100 active:bg-slate-200",
  danger: "bg-red-600 active:bg-red-700",
  ghost: "bg-transparent",
};

const textClasses = {
  primary: "text-white",
  secondary: "text-slate-900",
  danger: "text-white",
  ghost: "text-brand-600",
};

export function Button({
  label,
  variant = "primary",
  loading,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-12 items-center justify-center rounded-2xl px-4 ${variantClasses[variant]} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#0f172a" : "#fff"} />
      ) : (
        <Text className={`text-base font-semibold ${textClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
