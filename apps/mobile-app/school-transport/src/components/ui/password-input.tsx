import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

type PasswordInputProps = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  error?: string;
};

/**
 * Secure text input with a show/hide toggle. Follows the same visual language
 * as `<Input>` so existing forms can swap in without layout changes.
 */
export function PasswordInput({
  label,
  error,
  className,
  ...props
}: PasswordInputProps & { className?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-slate-700">{label}</Text>
      <View
        className={`min-h-12 flex-row items-center rounded-2xl border bg-white pl-4 pr-2 ${
          error ? "border-red-400" : "border-slate-200"
        } ${className ?? ""}`}
      >
        <TextInput
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textContentType="password"
          autoComplete="password"
          secureTextEntry={!visible}
          className="flex-1 py-2.5 text-base text-slate-900"
          {...props}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          className="rounded-xl p-2 active:bg-slate-100"
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#475569"
          />
        </Pressable>
      </View>
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
