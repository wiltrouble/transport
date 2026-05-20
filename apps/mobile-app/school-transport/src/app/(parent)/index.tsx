import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { ChildCard } from "@/components/parent/child-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useParentStore } from "@/store/parent-store";
import { useParentNotificationsStore } from "@/store/parent-notifications-store";

export default function ParentDashboardScreen() {
  const parent = useAuthStore((s) => s.parent);
  const refreshParentData = useAuthStore((s) => s.refreshParentData);
  const childrenOverviews = useParentStore((s) => s.childrenOverviews);
  const isRefreshing = useParentStore((s) => s.isRefreshing);
  const error = useParentStore((s) => s.error);
  const unreadCount = useParentNotificationsStore((s) => s.unreadCount);
  const notifConnected = useParentNotificationsStore((s) => s.connected);

  const onRefresh = useCallback(() => refreshParentData(), [refreshParentData]);

  const activeChildren = childrenOverviews.filter((c) => c.transportStatus === "active");

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title={`Hola, ${parent?.fullName?.split(" ")[0] ?? "Padre"}`}
        subtitle="Portal familiar de transporte escolar"
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        <View className="flex-row items-center justify-between">
          <Badge
            label={notifConnected ? "Realtime activo" : "Sincronizando…"}
            tone={notifConnected ? "success" : "warning"}
          />
          {unreadCount > 0 ? (
            <Badge label={`${unreadCount} sin leer`} tone="info" />
          ) : null}
        </View>

        {error ? (
          <Text className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</Text>
        ) : null}

        <Card>
          <Text className="text-sm font-medium text-slate-500">Resumen</Text>
          <Text className="mt-1 text-2xl font-bold text-slate-900">
            {childrenOverviews.length} hijo{childrenOverviews.length === 1 ? "" : "s"}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">
            {activeChildren.length} en transporte activo ahora
          </Text>
        </Card>

        {childrenOverviews.length === 0 ? (
          <EmptyState
            title="Sin hijos vinculados"
            description="Contacte al administrador para vincular estudiantes a su cuenta."
          />
        ) : (
          childrenOverviews.map((overview) => (
            <ChildCard key={overview.student.id} overview={overview} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
