import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/constants/theme";
import AppText from "./AppText";

type BannerProps = {
    title: string;
    message?: string;
    tone?: "warning" | "danger" | "info" | "success";
    icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
    onPress?: () => void;
};

const tones = {
    warning: { background: colors.warningSoft, border: "#F2C46B", text: colors.warning },
    danger: { background: colors.dangerSoft, border: "#F4A39C", text: colors.danger },
    info: { background: colors.primarySoft, border: "#B8CBE6", text: colors.primary },
    success: { background: colors.successSoft, border: "#A9D8BC", text: colors.success },
};

export default function Banner({ title, message, tone = "warning", icon = "alert-circle", onPress }: BannerProps) {
    const palette = tones[tone];

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? "button" : undefined}
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: palette.background, borderColor: palette.border },
                pressed && styles.pressed,
            ]}
        >
            <MaterialCommunityIcons name={icon} size={28} color={palette.text} />
            <View style={styles.texts}>
                <AppText variant="body" bold color={palette.text}>
                    {title}
                </AppText>
                {message ? (
                    <AppText variant="caption" color={colors.text}>
                        {message}
                    </AppText>
                ) : null}
            </View>
            {onPress ? <MaterialCommunityIcons name="chevron-right" size={28} color={palette.text} /> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1.5,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    pressed: {
        opacity: 0.8,
    },
});
