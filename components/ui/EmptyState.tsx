import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, spacing } from "@/constants/theme";
import AppText from "./AppText";
import Card from "./Card";

type EmptyStateProps = {
    icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
    title: string;
    message?: string;
    action?: ReactNode;
};

export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
    return (
        <Card style={styles.card}>
            <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={icon} size={44} color={colors.primary} />
            </View>
            <AppText variant="heading" align="center">
                {title}
            </AppText>
            {message ? (
                <AppText variant="body" align="center" color={colors.textMuted}>
                    {message}
                </AppText>
            ) : null}
            {action ? <View style={styles.action}>{action}</View> : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.xxl,
    },
    iconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    action: {
        alignSelf: "stretch",
        marginTop: spacing.md,
    },
});
