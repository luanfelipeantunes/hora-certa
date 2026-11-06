import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "@/constants/theme";

type CardProps = {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    accessibilityLabel?: string;
};

export default function Card({ children, style, onPress, accessibilityLabel }: CardProps) {
    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
            >
                {children}
            </Pressable>
        );
    }

    return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    pressed: {
        backgroundColor: colors.surfaceMuted,
    },
});
