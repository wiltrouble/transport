import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
      <Text className="text-center text-base font-semibold text-slate-800">{title}</Text>
      {description ? (
        <Text className="mt-2 text-center text-sm text-slate-500">{description}</Text>
      ) : null}
    </View>
  );
}
