import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, AppState, BackHandler, Easing, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MedicationSymbol from "@/components/medication/MedicationSymbol";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { describeSymbolWithArticle, getColor } from "@/constants/medication";
import { colors, radius, shadows, spacing } from "@/constants/theme";
import { useNow } from "@/hooks/useNow";
import type { Medication } from "@/types/medication";
import {
    alarmFromParams,
    getActiveAlarms,
    SNOOZE_MINUTES,
    stopAlarms,
    subscribeToAlarmEvents,
    type ActiveAlarm,
    type AlarmParams,
} from "@/utils/alarms";
import { formatLongDate, moment, type Moment } from "@/utils/date";
import { markDosesTaken, snoozeDoses } from "@/utils/medicationActions";
import { resolvePendingDoses, type Dose } from "@/utils/schedule";
import { loadData } from "@/utils/storage";

type Result = { type: "taken"; at: string; count: number } | { type: "snoozed"; at: string };

const AUTO_CLOSE_MS = 4000;

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Anel pulsando atrás do símbolo, para chamar a atenção. */
function Pulse({ size, color }: { size: number; color: string }) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration: 1600,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, [progress]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.pulse,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] }) }],
                },
            ]}
        />
    );
}

function DoseCard({ dose, large, now }: { dose: Dose; large: boolean; now: Moment }) {
    const { medication } = dose;
    const symbolSize = large ? 120 : 64;
    const late = now.diff(dose.time, "minutes") >= 5;

    const symbol = (
        <View style={[styles.symbolWrap, { width: symbolSize * 1.55, height: symbolSize * 1.55 }]}>
            <Pulse size={symbolSize * 1.55} color={getColor(medication.color).hex} />
            <MedicationSymbol shape={medication.shape} color={medication.color} size={symbolSize} tile />
        </View>
    );

    const names = (
        <>
            <AppText variant="title" align={large ? "center" : "left"} style={large ? styles.nameLarge : null}>
                {medication.name}
            </AppText>
            {medication.description ? (
                <AppText variant="bodyLarge" align={large ? "center" : "left"} color={colors.textMuted}>
                    {medication.description}
                </AppText>
            ) : null}
        </>
    );

    return (
        <View style={styles.doseCard}>
            {large ? (
                <>
                    {symbol}
                    <View style={styles.doseText}>{names}</View>
                </>
            ) : (
                <View style={styles.doseHeaderCompact}>
                    {symbol}
                    <View style={styles.doseTextCompact}>{names}</View>
                </View>
            )}

            <View style={styles.instruction}>
                <MaterialCommunityIcons name="package-variant-closed" size={24} color={colors.primary} />
                <AppText variant="bodyLarge" bold color={colors.primary} style={styles.instructionText}>
                    Pegue a caixa com {describeSymbolWithArticle(medication.shape, medication.color)}
                </AppText>
            </View>

            {late ? (
                <StatusChip label={`Horário previsto: ${dose.time.format("HH:mm")}`} tone="warning" icon="clock-alert-outline" />
            ) : null}
        </View>
    );
}

function Message({
    icon,
    tone,
    title,
    message,
    actionLabel,
    onAction,
}: {
    icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
    tone: "success" | "primary";
    title: string;
    message: string;
    actionLabel: string;
    onAction: () => void;
}) {
    const color = tone === "success" ? colors.success : colors.primary;
    const background = tone === "success" ? colors.successSoft : colors.primarySoft;

    return (
        <View style={styles.message}>
            <View style={[styles.messageIcon, { backgroundColor: background }]}>
                <MaterialCommunityIcons name={icon} size={88} color={color} />
            </View>
            <AppText variant="title" align="center">
                {title}
            </AppText>
            <AppText variant="bodyLarge" align="center" color={colors.textMuted}>
                {message}
            </AppText>
            <Button title={actionLabel} icon="home" size="lg" variant="secondary" onPress={onAction} style={styles.messageButton} />
        </View>
    );
}

export default function AlarmScreen() {
    const router = useRouter();
    const now = useNow();
    const params = useLocalSearchParams<AlarmParams>();
    const kind = firstParam(params.kind);
    const slot = firstParam(params.slot);
    const items = firstParam(params.items);

    const [alarms, setAlarms] = useState<ActiveAlarm[] | null>(null);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [busy, setBusy] = useState<"taken" | "snooze" | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async () => {
        const [active, data] = await Promise.all([
            getActiveAlarms().catch(() => [] as ActiveAlarm[]),
            loadData(),
        ]);
        const fromParams = alarmFromParams({ kind, slot, items });

        setAlarms(active.length > 0 ? active : fromParams ? [fromParams] : []);
        setMedications(data.medications);
    }, [kind, slot, items]);

    useEffect(() => {
        load();
        const unsubscribe = subscribeToAlarmEvents(load);
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") load();
        });
        return () => {
            unsubscribe();
            subscription.remove();
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, [load]);

    const pending = useMemo(
        () =>
            resolvePendingDoses(
                (alarms ?? []).filter((alarm) => alarm.kind === "medication").flatMap((alarm) => alarm.items),
                medications
            ),
        [alarms, medications]
    );

    const isTest = pending.length === 0 && (alarms ?? []).some((alarm) => alarm.kind === "test");
    const ringing = !result && (pending.length > 0 || isTest);

    // Enquanto o alarme toca, o botão "voltar" do Android não fecha a tela.
    useFocusEffect(
        useCallback(() => {
            const subscription = BackHandler.addEventListener("hardwareBackPress", () => ringing);
            return () => subscription.remove();
        }, [ringing])
    );

    const close = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        if (router.canGoBack()) router.back();
        else router.replace("/");
    }, [router]);

    const stopAll = useCallback(
        () => stopAlarms((alarms ?? []).map((alarm) => alarm.notificationId)).catch(() => {}),
        [alarms]
    );

    const finish = (next: Result) => {
        setResult(next);
        closeTimer.current = setTimeout(close, AUTO_CLOSE_MS);
    };

    const handleTaken = async () => {
        try {
            setBusy("taken");
            await stopAll();
            await markDosesTaken(pending.map((dose) => ({ medicationId: dose.medication.id, occurrence: dose.key })));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            finish({ type: "taken", at: moment().format("HH:mm"), count: pending.length });
        } catch (error) {
            console.error("[Alarm] erro ao confirmar", error);
            Alert.alert("Não foi possível confirmar", "Tente apertar de novo.");
        } finally {
            setBusy(null);
        }
    };

    const handleSnooze = async () => {
        try {
            setBusy("snooze");
            await stopAll();
            const { timestamp } = await snoozeDoses(
                pending.map((dose) => ({ medicationId: dose.medication.id, occurrence: dose.key }))
            );
            finish({ type: "snoozed", at: moment(timestamp).format("HH:mm") });
        } catch (error) {
            console.error("[Alarm] erro ao adiar", error);
            Alert.alert("Não foi possível adiar", "Tente apertar de novo.");
        } finally {
            setBusy(null);
        }
    };

    const handleClose = async () => {
        await stopAll();
        close();
    };

    let content;
    let footer = null;

    if (result?.type === "taken") {
        content = (
            <Message
                icon="check-circle"
                tone="success"
                title="Muito bem!"
                message={`${result.count > 1 ? "Remédios confirmados" : "Remédio confirmado"} às ${result.at}.`}
                actionLabel="Voltar ao início"
                onAction={close}
            />
        );
    } else if (result?.type === "snoozed") {
        content = (
            <Message
                icon="alarm-snooze"
                tone="primary"
                title="Combinado!"
                message={`O alarme vai tocar de novo às ${result.at}.`}
                actionLabel="Voltar ao início"
                onAction={close}
            />
        );
    } else if (alarms === null) {
        content = (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    } else if (isTest) {
        content = (
            <Message
                icon="check-decagram"
                tone="success"
                title="O alarme está funcionando!"
                message="Este foi só um teste. Na hora de cada remédio, o celular vai tocar e mostrar esta tela."
                actionLabel="Parar o teste"
                onAction={handleClose}
            />
        );
    } else if (pending.length === 0) {
        content = (
            <Message
                icon="check-all"
                tone="primary"
                title="Nenhum remédio pendente"
                message="Não há remédio para confirmar agora."
                actionLabel="Voltar ao início"
                onAction={handleClose}
            />
        );
    } else {
        content = (
            <>
                <View style={styles.top}>
                    <View style={styles.badge}>
                        <MaterialCommunityIcons name="bell-ring" size={22} color={colors.white} />
                        <AppText variant="label" color={colors.white}>
                            {pending.length > 1 ? `HORA DE ${pending.length} REMÉDIOS` : "HORA DO REMÉDIO"}
                        </AppText>
                    </View>
                    <AppText variant="display" align="center" style={styles.clock}>
                        {now.format("HH:mm")}
                    </AppText>
                    <AppText variant="bodyLarge" align="center" color={colors.textMuted}>
                        {formatLongDate(now)}
                    </AppText>
                </View>

                <View style={styles.doses}>
                    {pending.map((dose) => (
                        <DoseCard key={`${dose.medication.id}-${dose.key}`} dose={dose} large={pending.length === 1} now={now} />
                    ))}
                </View>
            </>
        );

        footer = (
            <View style={styles.footer}>
                <Button
                    title="JÁ TOMEI"
                    icon="check-bold"
                    variant="success"
                    size="xl"
                    loading={busy === "taken"}
                    disabled={busy !== null}
                    onPress={handleTaken}
                    accessibilityHint="Confirma que o remédio foi tomado e desliga o alarme"
                />
                <Button
                    title={`Lembrar em ${SNOOZE_MINUTES} minutos`}
                    icon="alarm-snooze"
                    variant="secondary"
                    size="lg"
                    loading={busy === "snooze"}
                    disabled={busy !== null}
                    onPress={handleSnooze}
                />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {content}
            </ScrollView>
            {footer}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FDF3E9",
    },
    content: {
        flexGrow: 1,
        padding: spacing.xl,
        gap: spacing.xl,
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    top: {
        alignItems: "center",
        gap: spacing.xs,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
    },
    clock: {
        fontSize: 72,
        lineHeight: 80,
        marginTop: spacing.sm,
    },
    doses: {
        gap: spacing.lg,
    },
    doseCard: {
        alignItems: "center",
        gap: spacing.lg,
        padding: spacing.xl,
        borderRadius: radius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.raised,
    },
    doseHeaderCompact: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
        gap: spacing.lg,
    },
    symbolWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    pulse: {
        position: "absolute",
    },
    doseText: {
        alignSelf: "stretch",
        gap: spacing.sm,
    },
    doseTextCompact: {
        flex: 1,
        gap: 2,
    },
    nameLarge: {
        fontSize: 34,
        lineHeight: 40,
    },
    instruction: {
        alignSelf: "stretch",
        justifyContent: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.primarySoft,
    },
    instructionText: {
        flexShrink: 1,
    },
    footer: {
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        backgroundColor: "#FDF3E9",
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    message: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingVertical: spacing.xxl,
    },
    messageIcon: {
        width: 152,
        height: 152,
        borderRadius: 76,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    messageButton: {
        marginTop: spacing.lg,
    },
});
