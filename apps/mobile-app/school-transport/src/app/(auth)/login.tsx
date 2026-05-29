import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, type LoginFormValues } from "@/validations/login";
import { useAuthStore } from "@/store/auth-store";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeError = useAuthStore((s) => s.error);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Defensive trim: when admins paste a temporary password from the web
      // dashboard they often capture leading/trailing whitespace, which
      // Appwrite Auth rejects as `user_invalid_credentials`.
      const email = values.email.trim().toLowerCase();
      const password = values.password.trim();
      const role = await login(email, password);
      if (role === "driver") {
        router.replace("/(driver)");
      } else if (role === "parent") {
        router.replace("/(parent)");
      }
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Error al iniciar sesión",
      });
    }
  });

  const rootError = errors.root?.message ?? storeError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-5 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900">Transporte Escolar</Text>
          <Text className="mt-2 text-base text-slate-500">
            Acceso para conductores y familias
          </Text>
        </View>

        <Card className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Correo electrónico"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="Contraseña"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                editable={!isLoading}
              />
            )}
          />

          {rootError ? (
            <Text className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {rootError}
            </Text>
          ) : null}

          <Button label="Iniciar sesión" loading={isLoading} onPress={onSubmit} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
