import {
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AlarmWatcher from "@/components/AlarmWatcher";
import { colors } from "@/constants/theme";
import "@/utils/date";

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
    initialRouteName: "(tabs)",
};

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        AtkinsonHyperlegible_400Regular,
        AtkinsonHyperlegible_700Bold,
        ...MaterialCommunityIcons.font,
    });
    const ready = fontsLoaded || Boolean(fontError);

    useEffect(() => {
        if (fontError) console.warn("[layout] falha ao carregar fontes", fontError);
        if (ready) SplashScreen.hideAsync().catch(() => {});
    }, [ready, fontError]);

    if (!ready) return null;

    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: "slide_from_right",
                }}
            >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="medication/new" />
                <Stack.Screen name="medication/[id]" />
                <Stack.Screen
                    name="alarm"
                    options={{
                        presentation: "fullScreenModal",
                        animation: "fade",
                        gestureEnabled: false,
                    }}
                />
            </Stack>
            <AlarmWatcher />
        </SafeAreaProvider>
    );
}
