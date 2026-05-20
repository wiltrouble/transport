import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { tabBarIcon } from "@/components/navigation/tab-bar-icon";
import { useAuthStore } from "@/store/auth-store";

function TabLabel({ title, focused }: { title: string; focused: boolean }) {
  return (
    <Text className={`text-xs font-medium ${focused ? "text-brand-600" : "text-slate-400"}`}>
      {title}
    </Text>
  );
}

export default function DriverLayout() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  if (!user || role !== "driver") {
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
        name="session"
        options={{
          title: "Sesión",
          tabBarIcon: tabBarIcon("bus-outline", "bus"),
          tabBarLabel: ({ focused }) => <TabLabel title="Sesión" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Asistencia",
          tabBarIcon: tabBarIcon("clipboard-outline", "clipboard"),
          tabBarLabel: ({ focused }) => <TabLabel title="Asistencia" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: "GPS",
          tabBarIcon: tabBarIcon("navigate-outline", "navigate"),
          tabBarLabel: ({ focused }) => <TabLabel title="GPS" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
