import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppText from "@/components/ui/AppText";
import { StatusChip } from "@/components/ui/Chip";
import { colors, radius, spacing } from "@/constants/theme";
import type { Moment } from "@/utils/date";
import type { Dose } from "@/utils/schedule";
import MedicationSymbol from "./MedicationSymbol";

type DoseRowProps = {
    dose: Dose;
    now: Moment;
    onPress?: () => void;
};

export type DoseState = "taken" | "late" | "now" | "upcoming";

export const getDoseState = (dose: Dose, now: Moment): DoseState => {
    if (dose.taken) return "taken";
    if (dose.time.isAfter(now)) return "upcoming";
    if (now.diff(dose.time, "minutes") < 60) return "now";
    return "late";
};

type ChipInfo = {
    label: string;
    tone: "success" | "warning" | "primary";
    icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
};

const stateChip: Record<DoseState, ChipInfo | null> = {
    taken: { label: "Tomado", tone: "success", icon: "check-bold" },
    now: { label: "Agora", tone: "primary", icon: "bell-ring" },
    late: { label: "Não confirmado", tone: "warning", icon: "alert-circle-outline" },
    upcoming: null,
};

export default function DoseRow({ dose, now, onPress }: DoseRowProps) {
    const state = getDoseState(dose, now);
    const chip = stateChip[state];
    const faded = state === "taken";

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={`${dose.time.format("HH:mm")}, ${dose.medication.name}${chip ? `, ${chip.label}` : ""}`}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
            <AppText variant="subheading" bold style={[styles.time, faded && styles.faded]}>
                {dose.time.format("HH:mm")}
            </AppText>

            <View style={faded ? styles.faded : null}>
                <MedicationSymbol shape={dose.medication.shape} color={dose.medication.color} size={30} tile />
            </View>

            <View style={styles.texts}>
                <AppText variant="bodyLarge" bold numberOfLines={1} style={faded && styles.faded}>
                    {dose.medication.name}
                </AppText>
                {chip ? (
                    <StatusChip label={chip.label} tone={chip.tone} icon={chip.icon} />
                ) : dose.medication.description ? (
                    <AppText variant="caption" numberOfLines={1}>
                        {dose.medication.description}
                    </AppText>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
    },
    pressed: {
        backgroundColor: colors.surfaceMuted,
    },
    time: {
        width: 62,
    },
    texts: {
        flex: 1,
        gap: 4,
    },
    faded: {
        opacity: 0.55,
    },
});
