import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { pushNotificationService } from "@/services/pushNotificationService";
import { useAuthStore } from "@/store/auth-store";

export default function ParentProfileScreen() {
  const parent = useAuthStore((s) => s.parent);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Mi perfil" subtitle="Datos de la cuenta familiar" />

      <View className="gap-4 px-4 pt-4">
        <Card>
          <Text className="text-sm font-medium text-slate-500">Nombre</Text>
          <Text className="mt-1 text-lg font-bold text-slate-900">{parent?.fullName ?? "—"}</Text>
          <Text className="mt-2 text-sm text-slate-600">{parent?.email ?? user?.email}</Text>
          <Text className="text-sm text-slate-600">Tel: {parent?.phone ?? "—"}</Text>
          <Text className="text-sm text-slate-600">
            Emergencia: {parent?.emergencyPhone ?? "—"}
          </Text>
        </Card>

        <Card>
          <Text className="mb-2 text-sm font-medium text-slate-500">Seguridad</Text>
          <Text className="mb-3 text-sm text-slate-600">
            Actualice la contraseña temporal recibida por su administrador.
          </Text>
          <Button
            label="Cambiar contraseña"
            variant="secondary"
            onPress={() => router.push({ pathname: "/(shared)/change-password" })}
          />
        </Card>

        <Card>
          <Text className="mb-2 text-sm font-medium text-slate-500">Notificaciones push</Text>
          <Text className="mb-3 text-sm text-slate-600">
            Registre este dispositivo para recibir alertas cuando el envío push esté habilitado en
            el servidor.
          </Text>
          <Button
            label="Registrar dispositivo"
            variant="secondary"
            onPress={async () => {
              if (!parent) return;
              await pushNotificationService.registerPushToken(parent.id);
            }}
          />
        </Card>

        <Button
          label="Cerrar sesión"
          variant="danger"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
        />
      </View>
    </View>
  );
}
