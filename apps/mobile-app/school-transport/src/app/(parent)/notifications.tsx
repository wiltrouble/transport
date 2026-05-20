import { useCallback } from "react";
import { FlatList, Text, View } from "react-native";
import { NotificationRow } from "@/components/parent/notification-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useParentNotificationsStore } from "@/store/parent-notifications-store";

export default function ParentNotificationsScreen() {
  const refreshParentData = useAuthStore((s) => s.refreshParentData);
  const notifications = useParentNotificationsStore((s) => s.notifications);
  const isLoading = useParentNotificationsStore((s) => s.isLoading);
  const markAsRead = useParentNotificationsStore((s) => s.markAsRead);

  const onRefresh = useCallback(() => refreshParentData(), [refreshParentData]);

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Notificaciones" subtitle="Alertas del transporte escolar" />

      {isLoading && notifications.length === 0 ? (
        <View className="gap-3 px-4 pt-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-4 pb-8 pt-4"
          refreshing={isLoading}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <EmptyState
              title="Sin notificaciones"
              description="Las alertas de sesión y asistencia aparecerán aquí automáticamente."
            />
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => {
                if (!item.isRead) void markAsRead(item.id);
              }}
            />
          )}
        />
      )}
    </View>
  );
}
