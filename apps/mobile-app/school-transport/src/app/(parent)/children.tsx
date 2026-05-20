import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { ChildCard } from "@/components/parent/child-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuthStore } from "@/store/auth-store";
import { useParentStore } from "@/store/parent-store";

export default function ParentChildrenScreen() {
  const refreshParentData = useAuthStore((s) => s.refreshParentData);
  const childrenOverviews = useParentStore((s) => s.childrenOverviews);
  const isRefreshing = useParentStore((s) => s.isRefreshing);

  const onRefresh = useCallback(() => refreshParentData(), [refreshParentData]);

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Mis hijos" subtitle="Estudiantes vinculados a su cuenta" />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {childrenOverviews.length === 0 ? (
          <EmptyState
            title="Sin hijos vinculados"
            description="El administrador debe asignar estudiantes en la tabla parent_students."
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
