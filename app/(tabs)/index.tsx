import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import DoseRow, { getDoseState } from "@/components/medication/DoseRow";
import MedicationSymbol from "@/components/medication/MedicationSymbol";
import AppText from "@/components/ui/AppText";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Screen from "@/components/ui/Screen";
import SectionTitle from "@/components/ui/SectionTitle";
import { describeSymbolWithArticle } from "@/constants/medication";
import { colors, radius, spacing } from "@/constants/theme";
import { useAlarmHealth } from "@/hooks/useAlarmHealth";
import { useAppData } from "@/hooks/useAppData";
import { useNow } from "@/hooks/useNow";
import { isAlarmHealthy } from "@/utils/alarms";
import { formatDayLabel, formatLongDate, formatTimeUntil, greeting, moment } from "@/utils/date";
import { markDosesTaken, unmarkDoseTaken } from "@/utils/medicationActions";
import { getDoses, getOverdueDoses, getUpcomingSlots, type Dose } from "@/utils/schedule";

/** Permite confirmar uma dose que ainda vai tocar se faltar até 1 hora. */
const EARLY_CONFIRM_MINUTES = 60;

const toRef = (dose: Dose) => ({ medicationId: dose.medication.id, occurrence: dose.key });

export default function HomeScreen() {
    const router = useRouter();
    const now = useNow();
    const { medications, loading } = useAppData();
    const { health } = useAlarmHealth();
    const [confirming, setConfirming] = useState(false);
    const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

    const todayDoses = useMemo(
        () => getDoses(medications, now.clone().startOf("day"), now.clone().add(1, "day").startOf("day")),
        [medications, now]
    );

    const focus = useMemo(() => {
        const overdue = getOverdueDoses(medications, now);
        if (overdue.length > 0) return { kind: "overdue" as const, doses: overdue, time: overdue[0].time };

        const [next] = getUpcomingSlots(medications, now.clone().add(1, "second"), 1);
        if (next) return { kind: "next" as const, doses: next.doses, time: next.time };

        return null;
    }, [medications, now]);

    const takenToday = todayDoses.filter((dose) => dose.taken).length;
    const canConfirmFocus =
        focus !== null &&
        (focus.kind === "overdue" || focus.time.diff(now, "minutes") < EARLY_CONFIRM_MINUTES);

    const confirmDoses = async (doses: Dose[]) => {
        try {
            setConfirming(true);
            await markDosesTaken(doses.map(toRef));
            setConfirmedAt(moment().format("HH:mm"));
        } catch (error) {
            console.error("[Home] erro ao confirmar dose", error);
            Alert.alert("Não foi possível confirmar", "Tente novamente.");
        } finally {
            setConfirming(false);
        }
    };

    const handleDosePress = (dose: Dose) => {
        const state = getDoseState(dose, now);
        const label = `${dose.medication.name} — ${dose.time.format("HH:mm")}`;

        if (state === "taken") {
            Alert.alert("Desmarcar esta dose?", `${label}\nUse só se ela foi marcada por engano.`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Desmarcar", style: "destructive", onPress: () => unmarkDoseTaken(toRef(dose)) },
            ]);
            return;
        }

        if (dose.time.diff(now, "minutes") >= EARLY_CONFIRM_MINUTES) {
            Alert.alert(label, `O alarme vai tocar ${formatTimeUntil(dose.time, now)}.`);
            return;
        }

        Alert.alert("Você já tomou este remédio?", label, [
            { text: "Ainda não", style: "cancel" },
            { text: "Sim, já tomei", onPress: () => confirmDoses([dose]) },
        ]);
    };

    const alarmProblem = !isAlarmHealthy(health);

    return (
        <Screen>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <AppText variant="title">{greeting(now)}!</AppText>
                    <AppText variant="bodyLarge" color={colors.textMuted}>
                        {formatLongDate(now)}
                    </AppText>
                </View>
                <View style={styles.clock}>
                    <AppText variant="heading" color={colors.primary}>
                        {now.format("HH:mm")}
                    </AppText>
                </View>
            </View>

            {alarmProblem ? (
                <Banner
                    tone="danger"
                    icon="bell-alert-outline"
                    title="O alarme pode não tocar"
                    message="Toque aqui para corrigir as permissões."
                    onPress={() => router.navigate("/settings")}
                />
            ) : null}

            {confirmedAt ? (
                <Banner
                    tone="success"
                    icon="check-circle"
                    title="Muito bem! Dose confirmada."
                    message={`Registrado às ${confirmedAt}.`}
                    onPress={() => setConfirmedAt(null)}
                />
            ) : null}

            {loading ? null : medications.length === 0 ? (
                <EmptyState
                    icon="pill"
                    title="Nenhum remédio cadastrado"
                    message="Cadastre os remédios com uma forma e uma cor. Na hora certa, o celular toca como um despertador."
                    action={
                        <Button
                            title="Cadastrar remédio"
                            icon="plus"
                            size="lg"
                            onPress={() => router.push("/medication/new")}
                        />
                    }
                />
            ) : focus ? (
                <Card style={[styles.hero, focus.kind === "overdue" && styles.heroOverdue]}>
                    <View style={styles.heroLabel}>
                        <MaterialCommunityIcons
                            name={focus.kind === "overdue" ? "alert-circle" : "alarm"}
                            size={22}
                            color={focus.kind === "overdue" ? colors.warning : colors.primary}
                        />
                        <AppText variant="label" color={focus.kind === "overdue" ? colors.warning : colors.primary}>
                            {focus.kind === "overdue" ? "AINDA NÃO CONFIRMADO" : "PRÓXIMO REMÉDIO"}
                        </AppText>
                    </View>

                    <View style={styles.heroTime}>
                        <AppText variant="display">{focus.time.format("HH:mm")}</AppText>
                        <AppText variant="bodyLarge" color={colors.textMuted}>
                            {focus.kind === "overdue"
                                ? "era para ter tomado"
                                : focus.time.isSame(now, "day")
                                    ? formatTimeUntil(focus.time, now)
                                    : `${formatDayLabel(focus.time, now).toLowerCase()}, ${formatTimeUntil(focus.time, now)}`}
                        </AppText>
                    </View>

                    <View style={styles.heroDoses}>
                        {focus.doses.map((dose) => (
                            <View key={`${dose.medication.id}-${dose.key}`} style={styles.heroDose}>
                                <MedicationSymbol shape={dose.medication.shape} color={dose.medication.color} size={52} tile />
                                <View style={styles.heroDoseText}>
                                    <AppText variant="heading">{dose.medication.name}</AppText>
                                    {dose.medication.description ? (
                                        <AppText variant="body" color={colors.textMuted}>
                                            {dose.medication.description}
                                        </AppText>
                                    ) : null}
                                    <AppText variant="caption">
                                        Caixa com {describeSymbolWithArticle(dose.medication.shape, dose.medication.color)}
                                    </AppText>
                                </View>
                            </View>
                        ))}
                    </View>

                    {canConfirmFocus ? (
                        <Button
                            title="Já tomei"
                            icon="check-bold"
                            variant="success"
                            size="lg"
                            loading={confirming}
                            onPress={() => confirmDoses(focus.doses)}
                        />
                    ) : (
                        <View style={styles.heroHint}>
                            <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.sage} />
                            <AppText variant="body" color={colors.textMuted} style={styles.flex}>
                                O celular vai tocar como despertador na hora certa.
                            </AppText>
                        </View>
                    )}
                </Card>
            ) : (
                <EmptyState
                    icon="check-all"
                    title="Nenhum remédio agendado"
                    message="Todos os tratamentos cadastrados já terminaram."
                />
            )}

            {medications.length > 0 ? (
                <>
                    <SectionTitle
                        title="Remédios de hoje"
                        right={
                            todayDoses.length > 0 ? (
                                <AppText variant="body" bold color={colors.textMuted}>
                                    {takenToday} de {todayDoses.length} tomados
                                </AppText>
                            ) : null
                        }
                    />

                    {todayDoses.length > 0 ? (
                        <Card style={styles.timeline}>
                            {todayDoses.map((dose, index) => (
                                <Fragment key={`${dose.medication.id}-${dose.key}`}>
                                    {index > 0 ? <View style={styles.divider} /> : null}
                                    <DoseRow dose={dose} now={now} onPress={() => handleDosePress(dose)} />
                                </Fragment>
                            ))}
                        </Card>
                    ) : (
                        <Card>
                            <AppText variant="body" color={colors.textMuted} align="center">
                                Nenhum remédio para hoje.
                            </AppText>
                        </Card>
                    )}
                </>
            ) : null}
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.xs,
    },
    headerText: {
        flex: 1,
    },
    clock: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.primarySoft,
    },
    hero: {
        gap: spacing.lg,
        borderWidth: 2,
        borderColor: "#C9D8EE",
    },
    heroOverdue: {
        borderColor: "#F2C46B",
        backgroundColor: "#FFFBF2",
    },
    heroLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    heroTime: {
        gap: 0,
    },
    heroDoses: {
        gap: spacing.lg,
    },
    heroDose: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
    },
    heroDoseText: {
        flex: 1,
        gap: 2,
    },
    heroHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.sageSoft,
    },
    timeline: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: spacing.sm,
    },
});
