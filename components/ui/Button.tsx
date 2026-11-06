import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, TOUCH_MIN } from "@/constants/theme";
import AppText from "./AppText";

type Variant = "primary" | "success" | "danger" | "secondary" | "ghost" | "dangerGhost";
type Size = "md" | "lg" | "xl";

type ButtonProps = {
    title: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;
    icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityHint?: string;
};

const palette: Record<Variant, { background: string; pressed: string; text: string; border?: string }> = {
    primary: { background: colors.primary, pressed: colors.primaryPressed, text: colors.white },
    success: { background: colors.success, pressed: colors.successPressed, text: colors.white },
    danger: { background: colors.danger, pressed: colors.dangerPressed, text: colors.white },
    secondary: { background: colors.surface, pressed: colors.surfaceMuted, text: colors.primary, border: colors.borderStrong },
    ghost: { background: "transparent", pressed: colors.primarySoft, text: colors.primary },
    dangerGhost: { background: "transparent", pressed: colors.dangerSoft, text: colors.danger },
};

const sizes: Record<Size, { height: number; font: number; icon: number; paddingX: number }> = {
    md: { height: TOUCH_MIN, font: 17, icon: 22, paddingX: 18 },
    lg: { height: 64, font: 20, icon: 26, paddingX: 22 },
    xl: { height: 84, font: 26, icon: 34, paddingX: 24 },
};

export default function Button({
    title,
    onPress,
    variant = "primary",
    size = "md",
    icon,
    disabled,
    loading,
    fullWidth = true,
    style,
    accessibilityHint,
}: ButtonProps) {
    const tone = palette[variant];
    const dimensions = sizes[size];
    const isDisabled = Boolean(disabled || loading);

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
            hitSlop={4}
            style={({ pressed }) => [
                styles.base,
                {
                    minHeight: dimensions.height,
                    paddingHorizontal: dimensions.paddingX,
                    backgroundColor: pressed ? tone.pressed : tone.background,
                    borderColor: tone.border ?? "transparent",
                    borderWidth: tone.border ? 1.5 : 0,
                    alignSelf: fullWidth ? "stretch" : "flex-start",
                },
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={tone.text} size={size === "md" ? "small" : "large"} />
            ) : (
                <View style={styles.content}>
                    {icon ? <MaterialCommunityIcons name={icon} size={dimensions.icon} color={tone.text} /> : null}
                    <AppText bold style={{ fontSize: dimensions.font, lineHeight: dimensions.font + 6 }} color={tone.text}>
                        {title}
                    </AppText>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        flexShrink: 1,
    },
    disabled: {
        opacity: 0.45,
    },
});
