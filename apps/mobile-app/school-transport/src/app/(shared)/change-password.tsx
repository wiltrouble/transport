import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { ScreenHeader } from "@/components/ui/screen-header";
import { usePasswordStore } from "@/store/password-store";
import {
  MIN_PASSWORD_LENGTH,
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/validations/change-password";

const DEFAULT_VALUES: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordScreen() {
  const router = useRouter();
  const isSubmitting = usePasswordStore((s) => s.isSubmitting);
  const error = usePasswordStore((s) => s.error);
  const successMessage = usePasswordStore((s) => s.successMessage);
  const submit = usePasswordStore((s) => s.changePassword);
  const reset = usePasswordStore((s) => s.reset);

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  // Fresh state every time the screen mounts (avoids showing a stale toast).
  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    // Defensive trim — temporary passwords are often pasted in and pick up
    // surrounding whitespace, which Appwrite rejects as wrong-credentials.
    const ok = await submit({
      currentPassword: values.currentPassword.trim(),
      newPassword: values.newPassword.trim(),
    });
    if (ok) {
      resetForm(DEFAULT_VALUES);
    }
  });

  const onCancel = () => {
    reset();
    resetForm(DEFAULT_VALUES);
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-slate-50"
    >
      <ScreenHeader
        title="Cambiar contraseña"
        subtitle="Actualice la contraseña temporal de su cuenta"
        right={
          <Pressable
            onPress={onCancel}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            className="rounded-xl p-2 active:bg-slate-100"
          >
            <Ionicons name="close" size={22} color="#475569" />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-12 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="gap-4">
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="Contraseña actual"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.currentPassword?.message}
                returnKeyType="next"
                editable={!isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="Nueva contraseña"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.newPassword?.message}
                returnKeyType="next"
                editable={!isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="Confirmar nueva contraseña"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                editable={!isSubmitting}
              />
            )}
          />

          <View className="rounded-2xl bg-slate-100 px-3 py-2.5">
            <Text className="text-xs text-slate-600">
              Mínimo {MIN_PASSWORD_LENGTH} caracteres. Su sesión continuará
              activa después del cambio.
            </Text>
          </View>

          {error ? (
            <View className="flex-row items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5">
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#b91c1c"
              />
              <Text className="flex-1 text-sm text-red-700">{error}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View className="flex-row items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#047857"
              />
              <Text className="flex-1 text-sm text-emerald-700">
                {successMessage}
              </Text>
            </View>
          ) : null}

          <View className="mt-1 gap-2">
            <Button
              label="Guardar contraseña"
              onPress={onSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
            <Button
              label="Cancelar"
              variant="secondary"
              onPress={onCancel}
              disabled={isSubmitting}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
