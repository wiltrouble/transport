import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { tabBarIcon } from "@/components/navigation/tab-bar-icon";
import { useAuthStore } from "@/store/auth-store";
import { useParentNotificationsStore } from "@/store/parent-notifications-store";
import { useParentRealtime } from "@/hooks/use-parent-realtime";

function TabLabel({ title, focused }: { title: string; focused: boolean }) {
  return (
    <Text className={`text-[10px] font-medium ${focused ? "text-brand-600" : "text-slate-400"}`}>
      {title}
    </Text>
  );
}

export default function ParentLayout() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const unreadCount = useParentNotificationsStore((s) => s.unreadCount);

  useParentRealtime(false);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role !== "parent") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          borderTopColor: "#e2e8f0",
          backgroundColor: "#fff",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: tabBarIcon("home-outline", "home"),
          tabBarLabel: ({ focused }) => <TabLabel title="Inicio" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: "Rastreo",
          tabBarIcon: tabBarIcon("map-outline", "map"),
          tabBarLabel: ({ focused }) => <TabLabel title="Rastreo" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alertas",
          tabBarIcon: tabBarIcon("notifications-outline", "notifications"),
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : undefined,
          tabBarLabel: ({ focused }) => <TabLabel title="Alertas" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: "Hijos",
          tabBarIcon: tabBarIcon("people-outline", "people"),
          tabBarLabel: ({ focused }) => <TabLabel title="Hijos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: tabBarIcon("person-outline", "person"),
          tabBarLabel: ({ focused }) => <TabLabel title="Perfil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
