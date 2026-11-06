import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import AppText from "./AppText";

export default function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
    return (
        <View style={styles.row}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
                {title}
            </AppText>
            {right}
        </View>
    );
}

export function FieldLabel({ children }: { children: string }) {
    return (
        <AppText variant="label" color={colors.textMuted}>
            {children}
        </AppText>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    title: {
        flexShrink: 1,
    },
});
