import { FontAwesome } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./BottomMenuStyles";

export default function BottomMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { bottom: insets.bottom }] }>
            <TouchableOpacity
                style={[styles.item, pathname === "/" && styles.activeItem]}
                onPress={() => router.push("/")}
            >
                <FontAwesome name="home" size={24} />
                <Text>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/newMedication")}
                style={[
                    styles.item,
                    pathname === "/newMedication" && styles.activeItem
                ]}
            >
                <FontAwesome name="plus" size={24} />
                <Text>Criar novo</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/listMedications")}
                style={[
                    styles.item,
                    pathname === "/listMedications" && styles.activeItem
                ]}
            >
                <FontAwesome name="medkit" size={24} />
                <Text>Medicamentos</Text>
            </TouchableOpacity>
        </View>
    )
}