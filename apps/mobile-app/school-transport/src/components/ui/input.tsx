import { Text, TextInput, View, type TextInputProps } from "react-native";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps & { className?: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        className={`min-h-12 rounded-2xl border bg-white px-4 text-base text-slate-900 ${error ? "border-red-400" : "border-slate-200"} ${className ?? ""}`}
        {...props}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
