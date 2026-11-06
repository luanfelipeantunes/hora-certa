import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius } from "@/constants/theme";
import AppText from "./AppText";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const tones: Record<Tone, { background: string; text: string }> = {
    neutral: { background: colors.surfaceMuted, text: colors.textMuted },
    primary: { background: colors.primarySoft, text: colors.primary },
    success: { background: colors.successSoft, text: colors.success },
    warning: { background: colors.warningSoft, text: colors.warning },
    danger: { background: colors.dangerSoft, text: colors.danger },
};

/** Etiqueta de status (não clicável). */
export function StatusChip({ label, tone = "neutral", icon }: { label: string; tone?: Tone; icon?: IconName }) {
    const palette = tones[tone];
    return (
        <View style={[styles.status, { backgroundColor: palette.background }]}>
            {icon ? <MaterialCommunityIcons name={icon} size={16} color={palette.text} /> : null}
            <AppText variant="label" color={palette.text}>
                {label}
            </AppText>
        </View>
    );
}

/** Opção rápida selecionável (ex.: "8 em 8 horas"). */
export function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceSelected,
                pressed && !selected && styles.choicePressed,
            ]}
        >
            {selected ? <MaterialCommunityIcons name="check" size={18} color={colors.white} /> : null}
            <AppText variant="body" bold color={selected ? colors.white : colors.primary}>
                {label}
            </AppText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    status: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    choice: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        minHeight: 46,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    choiceSelected: {
        backgroundColor: colors.primary,
    },
    choicePressed: {
        backgroundColor: colors.primarySoft,
    },
});
