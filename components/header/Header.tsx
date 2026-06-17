import { FontAwesome } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { styles } from "./HeaderStyles";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View style={styles.container}>
            {pathname === "/newMedication" &&
                <FontAwesome name="arrow-left" style={styles.icon} onPress={router.back} />
            }

            <Text style={styles.title}>Hora Certa</Text>
        </View>
    )
}