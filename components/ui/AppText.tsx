import { StyleSheet, Text, type TextProps } from "react-native";
import { colors, fonts } from "@/constants/theme";

export type TextVariant =
    | "display"
    | "title"
    | "heading"
    | "subheading"
    | "bodyLarge"
    | "body"
    | "label"
    | "caption";

type AppTextProps = TextProps & {
    variant?: TextVariant;
    bold?: boolean;
    color?: string;
    align?: "left" | "center" | "right";
};

/**
 * Texto padrão do app (fonte Atkinson Hyperlegible, criada para leitores com baixa visão).
 * Respeita o tamanho de fonte do sistema, com um limite para não quebrar o layout.
 */
export default function AppText({
    variant = "body",
    bold,
    color,
    align,
    style,
    maxFontSizeMultiplier = 1.35,
    ...props
}: AppTextProps) {
    const isBold = bold ?? (variant === "display" || variant === "title" || variant === "heading" || variant === "label");

    return (
        <Text
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            style={[
                styles.base,
                styles[variant],
                { fontFamily: isBold ? fonts.bold : fonts.regular },
                color ? { color } : null,
                align ? { textAlign: align } : null,
                style,
            ]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        color: colors.text,
    },
    display: {
        fontSize: 56,
        lineHeight: 62,
        letterSpacing: -1,
    },
    title: {
        fontSize: 30,
        lineHeight: 36,
        letterSpacing: -0.4,
    },
    heading: {
        fontSize: 22,
        lineHeight: 28,
    },
    subheading: {
        fontSize: 19,
        lineHeight: 25,
    },
    bodyLarge: {
        fontSize: 19,
        lineHeight: 26,
    },
    body: {
        fontSize: 17,
        lineHeight: 24,
    },
    label: {
        fontSize: 15,
        lineHeight: 20,
        letterSpacing: 0.2,
    },
    caption: {
        fontSize: 14,
        lineHeight: 19,
        color: colors.textMuted,
    },
});
