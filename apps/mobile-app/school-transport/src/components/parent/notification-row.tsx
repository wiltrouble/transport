import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppNotification } from "@school/types";

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  session_started: "bus-outline",
  student_boarded: "person-add-outline",
  student_dropped_off: "checkmark-circle-outline",
  vehicle_arriving: "navigate-outline",
  session_completed: "flag-outline",
  student_absent: "close-circle-outline",
};

type NotificationRowProps = {
  notification: AppNotification;
  onPress: () => void;
};

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const iconName = typeIcons[notification.type] ?? "notifications-outline";
  const time = new Date(notification.sentAt).toLocaleString();

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border px-4 py-3 ${
        notification.isRead
          ? "border-slate-100 bg-white"
          : "border-brand-100 bg-brand-50/50"
      }`}
    >
      <View className="flex-row gap-3">
        <View
          className={`size-10 items-center justify-center rounded-xl ${
            notification.isRead ? "bg-slate-100" : "bg-brand-100"
          }`}
        >
          <Ionicons
            name={iconName}
            size={20}
            color={notification.isRead ? "#64748b" : "#2563eb"}
          />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900">{notification.title}</Text>
          <Text className="mt-0.5 text-sm text-slate-600">{notification.message}</Text>
          <Text className="mt-1 text-xs text-slate-400">{time}</Text>
        </View>
        {!notification.isRead ? (
          <View className="mt-1 size-2 rounded-full bg-brand-600" />
        ) : null}
      </View>
    </Pressable>
  );
}
