import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Screen from "@/components/ui/Screen";
import SectionTitle from "@/components/ui/SectionTitle";
import { colors, radius, spacing } from "@/constants/theme";
import { useAlarmHealth } from "@/hooks/useAlarmHealth";
import { openAlarmSettings, scheduleTestAlarm } from "@/utils/alarms";

const TEST_DELAY_SECONDS = 10;

type CheckItemProps = {
    ok: boolean;
    title: string;
    okText: string;
    problemText: string;
    actionLabel: string;
    onAction: () => void;
};

function CheckItem({ ok, title, okText, problemText, actionLabel, onAction }: CheckItemProps) {
    return (
        <View style={styles.check}>
            <View style={[styles.checkIcon, { backgroundColor: ok ? colors.successSoft : colors.dangerSoft }]}>
                <MaterialCommunityIcons
                    name={ok ? "check-bold" : "alert"}
                    size={24}
                    color={ok ? colors.success : colors.danger}
                />
            </View>
            <View style={styles.checkText}>
                <AppText variant="bodyLarge" bold>
                    {title}
                </AppText>
                <AppText variant="body" color={ok ? colors.textMuted : colors.danger}>
                    {ok ? okText : problemText}
                </AppText>
                {!ok ? (
                    <Button title={actionLabel} variant="secondary" fullWidth={false} onPress={onAction} style={styles.checkAction} />
                ) : null}
            </View>
        </View>
    );
}

function Tip({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; text: string }) {
    return (
        <View style={styles.tip}>
            <MaterialCommunityIcons name={icon} size={24} color={colors.sage} />
            <AppText variant="body" style={styles.flex}>
                {text}
            </AppText>
        </View>
    );
}

export default function SettingsScreen() {
    const { health, refresh } = useAlarmHealth();
    const [testing, setTesting] = useState(false);

    const run = (action: () => Promise<unknown>) => async () => {
        try {
            await action();
        } catch (error) {
            console.warn("[Settings] não foi possível abrir os ajustes", error);
            await openAlarmSettings.app().catch(() => {});
        } finally {
            refresh();
        }
    };

    const handleTest = async () => {
        try {
            setTesting(true);
            await scheduleTestAlarm(TEST_DELAY_SECONDS);
            Alert.alert(
                "Teste agendado",
                `O alarme vai tocar em ${TEST_DELAY_SECONDS} segundos.\n\nPara um teste completo, bloqueie a tela agora e espere.`
            );
        } catch (error) {
            console.error("[Settings] erro no teste do alarme", error);
            Alert.alert("Não foi possível testar", "Confira as permissões acima e tente de novo.");
        } finally {
            setTesting(false);
        }
    };

    const version = Constants.expoConfig?.version ?? "";

    return (
        <Screen title="Ajustes" subtitle="Confira se o alarme está pronto para tocar.">
            <Card style={styles.section}>
                <SectionTitle title="Alarme" />

                {health ? (
                    <View style={styles.checks}>
                        <CheckItem
                            ok={health.notificationsAllowed && !health.channelBlocked}
                            title="Notificações"
                            okText="Permitidas."
                            problemText="Bloqueadas. Sem isso o alarme não aparece."
                            actionLabel="Permitir"
                            onAction={run(health.notificationsAllowed ? openAlarmSettings.channel : openAlarmSettings.notifications)}
                        />
                        {Platform.OS === "android" ? (
                            <>
                                <CheckItem
                                    ok={health.exactAlarmsAllowed}
                                    title="Alarmes e lembretes"
                                    okText="Permitido. O alarme toca na hora exata."
                                    problemText="Desativado. O alarme pode atrasar ou não tocar."
                                    actionLabel="Permitir"
                                    onAction={run(openAlarmSettings.exactAlarms)}
                                />
                                <CheckItem
                                    ok={health.fullScreenAllowed}
                                    title="Alarme em tela cheia"
                                    okText="Permitido. O alarme abre sozinho, até com a tela bloqueada."
                                    problemText="Bloqueado. O celular toca, mas a tela do remédio não abre sozinha."
                                    actionLabel="Permitir"
                                    onAction={run(openAlarmSettings.fullScreen)}
                                />
                                <CheckItem
                                    ok={!health.batteryOptimized}
                                    title="Economia de bateria"
                                    okText="Desligada para o Hora Certa."
                                    problemText="Ligada. O celular pode bloquear o alarme para economizar bateria."
                                    actionLabel="Desligar para este app"
                                    onAction={run(async () => {
                                        const direct = await openAlarmSettings.battery();
                                        if (!direct) {
                                            Alert.alert(
                                                "Desligar a economia de bateria",
                                                "Na lista, procure “Hora Certa” e escolha “Não otimizar” (ou “Sem restrições”)."
                                            );
                                        }
                                    })}
                                />
                                {health.alarmVolume !== null ? (
                                    <CheckItem
                                        ok={health.alarmVolume >= 0.5}
                                        title="Volume do alarme"
                                        okText={`Em ${Math.round(health.alarmVolume * 100)}%.`}
                                        problemText={
                                            health.alarmVolume === 0
                                                ? "No mudo. O alarme não vai fazer som."
                                                : `Baixo (${Math.round(health.alarmVolume * 100)}%). Aumente o volume de alarme.`
                                        }
                                        actionLabel="Ajustar volume"
                                        onAction={() =>
                                            Alert.alert(
                                                "Aumentar o volume do alarme",
                                                "Aperte o botão de volume do celular, toque nos três pontinhos (ou na engrenagem) e aumente o volume de “Alarme”."
                                            )
                                        }
                                    />
                                ) : null}
                            </>
                        ) : null}
                    </View>
                ) : (
                    <AppText variant="body" color={colors.textMuted}>
                        Verificando…
                    </AppText>
                )}

                {Platform.OS === "android" && health?.hasPowerManager ? (
                    <View style={styles.manufacturer}>
                        <AppText variant="body" color={colors.textMuted}>
                            Este celular tem um gerenciador de energia próprio. Libere o Hora Certa para rodar em segundo plano.
                        </AppText>
                        <Button
                            title="Abrir gerenciador de energia"
                            icon="battery-heart-variant"
                            variant="secondary"
                            onPress={run(openAlarmSettings.powerManager)}
                        />
                    </View>
                ) : null}

                <Button
                    title="Testar o alarme"
                    icon="alarm"
                    size="lg"
                    loading={testing}
                    onPress={handleTest}
                    accessibilityHint={`Faz o alarme tocar em ${TEST_DELAY_SECONDS} segundos`}
                />
            </Card>

            <Card style={styles.section}>
                <SectionTitle title="Dicas para o alarme tocar sempre" />
                <Tip icon="volume-high" text="Deixe o volume de ALARME do celular alto. O Hora Certa usa o mesmo volume do despertador." />
                <Tip icon="battery-charging" text="Mantenha o celular carregado e ligado." />
                <Tip icon="gesture-swipe-up" text="Evite fechar o app arrastando na lista de apps recentes." />
                <Tip icon="pencil-outline" text="Desenhe na caixa de cada remédio a mesma forma e cor cadastradas aqui." />
            </Card>

            <Card style={[styles.section, styles.about]}>
                <Image
                    source={require("@/assets/images/icon.png")}
                    style={styles.logo}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                />
                <View style={styles.flex}>
                    <AppText variant="heading">Hora Certa</AppText>
                    <AppText variant="body" color={colors.textMuted}>
                        O remédio certo, na hora certa.
                    </AppText>
                    {version ? <AppText variant="caption">Versão {version}</AppText> : null}
                </View>
            </Card>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    section: {
        gap: spacing.lg,
    },
    checks: {
        gap: spacing.lg,
    },
    check: {
        flexDirection: "row",
        gap: spacing.md,
        alignItems: "flex-start",
    },
    checkIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    checkText: {
        flex: 1,
        gap: 2,
    },
    checkAction: {
        marginTop: spacing.sm,
    },
    manufacturer: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceMuted,
    },
    tip: {
        flexDirection: "row",
        gap: spacing.md,
        alignItems: "flex-start",
    },
    about: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 16,
    },
});
