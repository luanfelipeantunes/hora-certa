import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { describeSymbol } from "@/constants/medication";
import { colors, spacing } from "@/constants/theme";
import type { Medication } from "@/types/medication";
import { formatDayLabel, formatList, type Moment } from "@/utils/date";
import {
    describeFrequency,
    getDailyTimes,
    getLastOccurrence,
    getMedicationStatus,
    getStartMoment,
} from "@/utils/schedule";
import MedicationSymbol from "./MedicationSymbol";

type MedicationCardProps = {
    medication: Medication;
    now: Moment;
    onEdit: () => void;
    onDelete: () => void;
};

function InfoLine({ icon, text }: { icon: ComponentProps<typeof MaterialCommunityIcons>["name"]; text: string }) {
    return (
        <View style={styles.infoLine}>
            <MaterialCommunityIcons name={icon} size={20} color={colors.textMuted} style={styles.infoIcon} />
            <AppText variant="body" color={colors.textMuted} style={styles.infoText}>
                {text}
            </AppText>
        </View>
    );
}

export default function MedicationCard({ medication, now, onEdit, onDelete }: MedicationCardProps) {
    const status = getMedicationStatus(medication, now);
    const start = getStartMoment(medication);
    const last = getLastOccurrence(medication);
    const dailyTimes = getDailyTimes(medication);
    const frequency = describeFrequency(medication.periodicity.recurrency, medication.periodicity.unit);

    const scheduleText = dailyTimes
        ? `${frequency} · ${formatList(dailyTimes)}`
        : `${frequency} · a partir das ${medication.startTime}`;

    const startText = start ? `${formatDayLabel(start, now)}${start.isSame(now, "year") ? "" : `/${start.format("YYYY")}`}` : "";

    const periodText =
        medication.duration == null
            ? `Uso contínuo, desde ${startText.toLowerCase()}`
            : last
                ? `${medication.duration} ${medication.duration === 1 ? "dia" : "dias"} · última dose ${formatDayLabel(last, now).toLowerCase()} às ${last.format("HH:mm")}`
                : `${medication.duration} dias`;

    return (
        <Card onPress={onEdit} accessibilityLabel={`${medication.name}. Toque para editar.`} style={styles.card}>
            <View style={styles.header}>
                <MedicationSymbol shape={medication.shape} color={medication.color} size={46} tile />
                <View style={styles.headerText}>
                    <AppText variant="heading" numberOfLines={2}>
                        {medication.name}
                    </AppText>
                    {medication.description ? (
                        <AppText variant="body" color={colors.textMuted} numberOfLines={2}>
                            {medication.description}
                        </AppText>
                    ) : null}
                    {status === "finished" ? (
                        <StatusChip label="Tratamento encerrado" tone="neutral" icon="check-all" />
                    ) : status === "scheduled" ? (
                        <StatusChip label={`Começa ${startText.toLowerCase()} às ${medication.startTime}`} tone="primary" icon="calendar-clock" />
                    ) : null}
                </View>
            </View>

            <View style={styles.info}>
                <InfoLine icon="shape-outline" text={`Caixa marcada com: ${describeSymbol(medication.shape, medication.color)}`} />
                <InfoLine icon="clock-outline" text={scheduleText} />
                <InfoLine icon="calendar-month-outline" text={periodText} />
            </View>

            <View style={styles.actions}>
                <Button title="Editar" icon="pencil" variant="secondary" onPress={onEdit} style={styles.action} />
                <Button title="Excluir" icon="trash-can-outline" variant="dangerGhost" onPress={onDelete} style={styles.action} />
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.md,
    },
    header: {
        flexDirection: "row",
        gap: spacing.lg,
        alignItems: "center",
    },
    headerText: {
        flex: 1,
        gap: 4,
    },
    info: {
        gap: 6,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    infoLine: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    infoIcon: {
        marginTop: 2,
    },
    infoText: {
        flex: 1,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.md,
    },
    action: {
        flex: 1,
    },
});
