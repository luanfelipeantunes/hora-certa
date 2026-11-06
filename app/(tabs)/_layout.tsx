import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const tabIcon = (active: IconName, inactive: IconName) => {
    const TabIcon = ({ color, focused }: { color: string; focused: boolean }) => (
        <MaterialCommunityIcons name={focused ? active : inactive} size={30} color={color} />
    );
    TabIcon.displayName = `TabIcon(${active})`;
    return TabIcon;
};

export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSubtle,
                tabBarActiveBackgroundColor: colors.primarySoft,
                tabBarStyle: {
                    height: 76 + insets.bottom,
                    paddingTop: 6,
                    paddingHorizontal: 8,
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                },
                tabBarItemStyle: {
                    borderRadius: 16,
                    marginHorizontal: 4,
                    marginBottom: 6,
                },
                tabBarLabelStyle: {
                    fontFamily: fonts.bold,
                    fontSize: 15,
                },
                tabBarAllowFontScaling: false,
                sceneStyle: { backgroundColor: colors.background },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{ title: "Hoje", tabBarIcon: tabIcon("calendar-clock", "calendar-clock-outline") }}
            />
            <Tabs.Screen
                name="medications"
                options={{ title: "Remédios", tabBarIcon: tabIcon("pill", "pill") }}
            />
            <Tabs.Screen
                name="settings"
                options={{ title: "Ajustes", tabBarIcon: tabIcon("cog", "cog-outline") }}
            />
        </Tabs>
    );
}
