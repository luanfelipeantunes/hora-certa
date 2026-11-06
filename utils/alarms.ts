/**
 * Alarmes dos remédios (notifee).
 *
 * Como funciona:
 * - Doses do mesmo horário viram UM alarme (um único som, uma tela com todos os remédios).
 * - Só os próximos horários são agendados (MAX_SCHEDULED). O Android limita cada app a 500
 *   alarmes e o iOS a 64 notificações pendentes; agendar o tratamento inteiro estourava esse
 *   limite e impedia cadastrar novos remédios. A agenda é completada sempre que o app abre,
 *   volta para a tela, um alarme toca ou algo é salvo.
 * - A sincronização compara o que está agendado no sistema com o que deveria estar e só
 *   cancela/cria a diferença. Assim alarmes "órfãos" (de remédios excluídos ou de versões
 *   antigas do app) também são removidos.
 * - No Android o alarme usa um canal com som de ALARME (criado no código nativo pelo plugin
 *   plugins/withHoraCertaAlarm.js), repete o som até ser confirmado e abre a tela de alerta
 *   por cima da tela de bloqueio.
 */
import notifee, {
    AlarmType,
    AndroidCategory,
    AndroidImportance,
    AndroidNotificationSetting,
    AndroidVisibility,
    AuthorizationStatus,
    TriggerType,
    type Notification,
    type TimestampTrigger,
} from "@notifee/react-native";
import { Linking, Platform } from "react-native";
import { getColor } from "@/constants/medication";
import * as AlarmDevice from "@/modules/alarm-device";
import type { DoseRef, Medication, Snooze } from "@/types/medication";
import { formatList, moment } from "./date";
import { getUpcomingSlots, resolvePendingDoses, type Dose } from "./schedule";
import { loadData } from "./storage";

/** Precisa ser igual ao CHANNEL_ID de plugins/withHoraCertaAlarm.js. */
export const ALARM_CHANNEL_ID = "hora-certa-alarm-v1";
const ALARM_SOUND = "hora_certa_alarm";
const SMALL_ICON = "ic_stat_hora_certa";
const LEGACY_CHANNEL_IDS = ["medication-reminders"];

const MEDICATION_ALARM = "medication-alarm";
const TEST_ALARM = "test-alarm";

const ALARM_PREFIX = "alarm-";
const SNOOZE_PREFIX = "snooze-";
const TEST_PREFIX = "test-";

/** Quantos horários futuros manter agendados (bem abaixo dos limites do sistema). */
const MAX_SCHEDULED = Platform.OS === "ios" ? 48 : 120;

/** Margem para não agendar algo que já estaria no passado quando chegar ao sistema. */
const SCHEDULE_MARGIN_MS = 3000;

export const SNOOZE_MINUTES = 10;

export type AlarmKind = "medication" | "test";

export type ActiveAlarm = {
    notificationId: string;
    kind: AlarmKind;
    slot: number;
    items: DoseRef[];
};

export type AlarmParams = {
    kind?: string;
    slot?: string;
    items?: string;
};

type NotificationData = Record<string, string | number | object> | undefined;

const hashString = (value: string) => {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
    }
    return (hash >>> 0).toString(36);
};

let channelPromise: Promise<void> | null = null;

/** Garante o canal do alarme no Android (normalmente já criado pelo código nativo). */
export const ensureAlarmChannel = () => {
    if (Platform.OS !== "android") return Promise.resolve();

    if (!channelPromise) {
        channelPromise = (async () => {
            if (!(await notifee.isChannelCreated(ALARM_CHANNEL_ID))) {
                // Plano B: se o canal nativo não existir, cria pelo notifee (som de notificação).
                await notifee.createChannel({
                    id: ALARM_CHANNEL_ID,
                    name: "Alarme dos remédios",
                    description: "Toca como despertador na hora de tomar cada remédio",
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    sound: "default",
                    vibration: true,
                    vibrationPattern: [300, 800, 400, 800],
                    bypassDnd: true,
                });
            }

            for (const legacyId of LEGACY_CHANNEL_IDS) {
                if (await notifee.isChannelCreated(legacyId)) {
                    await notifee.deleteChannel(legacyId);
                }
            }
        })().catch((error) => {
            channelPromise = null;
            throw error;
        });
    }

    return channelPromise;
};

const buildNotification = (
    id: string,
    kind: AlarmKind,
    slot: number,
    doses: Dose[],
    content: { title: string; body: string; color: string; fullScreenAllowed: boolean }
): Notification => ({
    id,
    title: content.title,
    body: content.body,
    data: {
        kind: kind === "test" ? TEST_ALARM : MEDICATION_ALARM,
        slot: String(slot),
        items: JSON.stringify(doses.map((dose) => ({ medicationId: dose.medication.id, occurrence: dose.key }))),
    },
    android: {
        channelId: ALARM_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: SMALL_ICON,
        color: content.color,
        // Repete o som até a dose ser confirmada e não deixa a notificação ser descartada.
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        // Com a tela cheia permitida, quem acende a tela é a própria tela de alerta. Acender antes
        // faz o Android (em celulares sem bloqueio de tela) mostrar só um aviso no topo.
        lightUpScreen: !content.fullScreenAllowed,
        showTimestamp: true,
        timestamp: slot,
        pressAction: { id: "default", launchActivity: "default" },
        // Acende a tela e abre o app direto na tela de alerta (inclusive com o celular bloqueado).
        fullScreenAction: { id: "default", launchActivity: "default" },
    },
    ios: {
        sound: "default",
        interruptionLevel: "timeSensitive",
    },
});

const buildDoseNotification = (id: string, slot: number, doses: Dose[], fullScreenAllowed: boolean) => {
    const [first] = doses;
    const names = doses.map((dose) => dose.medication.name);

    return buildNotification(id, "medication", slot, doses, {
        title: doses.length > 1 ? `Hora de tomar ${doses.length} remédios` : "Hora do remédio",
        body:
            doses.length > 1
                ? formatList(names)
                : `${first.medication.name}${first.medication.description ? ` — ${first.medication.description}` : ""}`,
        color: getColor(first.medication.color).hex,
        fullScreenAllowed,
    });
};

const buildTrigger = (timestamp: number): TimestampTrigger => ({
    type: TriggerType.TIMESTAMP,
    timestamp,
    // SET_ALARM_CLOCK é o tipo mais confiável do Android: ignora o modo soneca (Doze)
    // e mostra o ícone de despertador na barra de status.
    alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
});

type DesiredAlarm = { notification: Notification; trigger: TimestampTrigger };

const contentSignature = (doses: Dose[], fullScreenAllowed: boolean) =>
    hashString(
        JSON.stringify([
            fullScreenAllowed,
            ...doses.map((dose) => [
                dose.medication.id,
                dose.key,
                dose.medication.name,
                dose.medication.description,
                dose.medication.color,
            ]),
        ])
    );

const buildDesiredAlarms = (medications: Medication[], snoozes: Snooze[]) => {
    const desired = new Map<string, DesiredAlarm>();
    const minTimestamp = Date.now() + SCHEDULE_MARGIN_MS;
    const fullScreenAllowed = AlarmDevice.canUseFullScreenIntent();

    for (const snooze of snoozes) {
        if (snooze.timestamp < minTimestamp) continue;

        const doses = resolvePendingDoses(snooze.items, medications);
        if (doses.length === 0) continue;

        const id = `${SNOOZE_PREFIX}${snooze.id}-${contentSignature(doses, fullScreenAllowed)}`;
        desired.set(id, {
            notification: buildDoseNotification(id, snooze.timestamp, doses, fullScreenAllowed),
            trigger: buildTrigger(snooze.timestamp),
        });
    }

    const slots = getUpcomingSlots(medications, moment(minTimestamp), MAX_SCHEDULED - desired.size);

    for (const slot of slots) {
        const timestamp = slot.time.valueOf();
        const id = `${ALARM_PREFIX}${timestamp}-${contentSignature(slot.doses, fullScreenAllowed)}`;
        desired.set(id, {
            notification: buildDoseNotification(id, timestamp, slot.doses, fullScreenAllowed),
            trigger: buildTrigger(timestamp),
        });
    }

    return desired;
};

export type SyncResult = {
    scheduled: number;
    failed: number;
};

const syncAlarmsNow = async (): Promise<SyncResult> => {
    await ensureAlarmChannel();

    const { medications, snoozes } = await loadData();
    const desired = buildDesiredAlarms(medications, snoozes);
    const existingIds = await notifee.getTriggerNotificationIds();
    const existing = new Set(existingIds);

    // Cancela tudo que não deveria estar agendado (inclusive alarmes antigos/órfãos),
    // exceto o alarme de teste.
    const toCancel = existingIds.filter((id) => !desired.has(id) && !id.startsWith(TEST_PREFIX));
    if (toCancel.length > 0) {
        await notifee.cancelTriggerNotifications(toCancel);
    }

    let failed = 0;
    for (const [id, alarm] of desired) {
        if (existing.has(id)) continue;

        try {
            await notifee.createTriggerNotification(alarm.notification, alarm.trigger);
        } catch (error) {
            failed += 1;
            console.warn(`[alarms] não foi possível agendar ${id}`, error);
        }
    }

    return { scheduled: desired.size - failed, failed };
};

let syncQueue: Promise<unknown> = Promise.resolve();

/** Agenda/atualiza os alarmes conforme os remédios salvos. Chamadas são executadas em fila. */
export const syncAlarms = (): Promise<SyncResult> => {
    const run = syncQueue.then(syncAlarmsNow);
    syncQueue = run.catch(() => undefined);
    return run;
};

let lastSyncAt = 0;

/** Igual a `syncAlarms`, mas ignora chamadas muito próximas (ex.: app indo e voltando). */
export const syncAlarmsThrottled = (minIntervalMs = 60 * 1000) => {
    if (Date.now() - lastSyncAt < minIntervalMs) return Promise.resolve(null);
    lastSyncAt = Date.now();
    return syncAlarms();
};

const parseItems = (value: unknown): DoseRef[] => {
    if (typeof value !== "string") return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
            ? parsed
                .filter((item) => item && typeof item.medicationId === "string" && typeof item.occurrence === "string")
                .map((item) => ({ medicationId: item.medicationId, occurrence: item.occurrence }))
            : [];
    } catch {
        return [];
    }
};

/** Lê os dados de uma notificação de alarme. Retorna `null` se não for um alarme do app. */
export const parseAlarm = (notificationId: string | undefined, data: NotificationData): ActiveAlarm | null => {
    if (!data) return null;

    if (data.kind === MEDICATION_ALARM || data.kind === TEST_ALARM) {
        return {
            notificationId: notificationId ?? "",
            kind: data.kind === TEST_ALARM ? "test" : "medication",
            slot: Number(data.slot) || Date.now(),
            items: parseItems(data.items),
        };
    }

    // Alarmes criados pela versão anterior do app.
    if (typeof data.medicationId === "string" && typeof data.medicationOccurrence === "string") {
        return {
            notificationId: notificationId ?? "",
            kind: "medication",
            slot: Date.now(),
            items: [{ medicationId: data.medicationId, occurrence: data.medicationOccurrence }],
        };
    }

    return null;
};

export const alarmToParams = (alarm: ActiveAlarm): AlarmParams => ({
    kind: alarm.kind,
    slot: String(alarm.slot),
    items: JSON.stringify(alarm.items),
});

export const alarmFromParams = (params: AlarmParams): ActiveAlarm | null => {
    const items = parseItems(params.items);
    if (params.kind !== "test" && items.length === 0) return null;

    return {
        notificationId: "",
        kind: params.kind === "test" ? "test" : "medication",
        slot: Number(params.slot) || Date.now(),
        items,
    };
};

/** Alarmes tocando/exibidos agora. */
export const getActiveAlarms = async (): Promise<ActiveAlarm[]> => {
    const displayed = await notifee.getDisplayedNotifications();

    return displayed
        .map((item) => parseAlarm(item.id ?? item.notification.id, item.notification.data))
        .filter((alarm): alarm is ActiveAlarm => alarm !== null);
};

/** Para o som e remove as notificações de alarme informadas. */
export const stopAlarms = async (notificationIds: string[]) => {
    const ids = notificationIds.filter(Boolean);
    if (ids.length > 0) {
        await notifee.cancelDisplayedNotifications(ids);
    }
};

/** Agenda um alarme de teste para daqui a alguns segundos. */
export const scheduleTestAlarm = async (seconds = 10) => {
    await ensureAlarmChannel();

    const timestamp = Date.now() + seconds * 1000;
    const id = `${TEST_PREFIX}${timestamp}`;

    await notifee.createTriggerNotification(
        buildNotification(id, "test", timestamp, [], {
            title: "Teste do alarme",
            body: "Se você está vendo isto, o alarme do Hora Certa está funcionando.",
            color: "#1F4E8C",
            fullScreenAllowed: AlarmDevice.canUseFullScreenIntent(),
        }),
        buildTrigger(timestamp)
    );

    return timestamp;
};

export type AlarmHealth = {
    notificationsAllowed: boolean;
    channelBlocked: boolean;
    exactAlarmsAllowed: boolean;
    /** Android 14+: pode abrir a tela do alarme sozinho, por cima da tela de bloqueio. */
    fullScreenAllowed: boolean;
    batteryOptimized: boolean;
    hasPowerManager: boolean;
    /** Volume de alarme de 0 a 1 (`null` se não for possível ler). */
    alarmVolume: number | null;
};

export const isAlarmHealthy = (health: AlarmHealth | null) =>
    !health ||
    (health.notificationsAllowed &&
        !health.channelBlocked &&
        health.exactAlarmsAllowed &&
        health.fullScreenAllowed &&
        !health.batteryOptimized &&
        health.alarmVolume !== 0);

/** Verifica as permissões/configurações que podem impedir o alarme de tocar. */
export const getAlarmHealth = async (): Promise<AlarmHealth> => {
    const settings = await notifee.getNotificationSettings();
    const notificationsAllowed =
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

    if (Platform.OS !== "android") {
        return {
            notificationsAllowed,
            channelBlocked: false,
            exactAlarmsAllowed: true,
            fullScreenAllowed: true,
            batteryOptimized: false,
            hasPowerManager: false,
            alarmVolume: null,
        };
    }

    const volume = AlarmDevice.getAlarmVolume();
    const ignoringBattery = AlarmDevice.isIgnoringBatteryOptimizations();

    const [channelBlocked, batteryOptimized, powerManager] = await Promise.all([
        notifee.isChannelBlocked(ALARM_CHANNEL_ID).catch(() => false),
        notifee.isBatteryOptimizationEnabled().catch(() => false),
        notifee.getPowerManagerInfo().catch(() => null),
    ]);

    return {
        notificationsAllowed,
        channelBlocked,
        exactAlarmsAllowed: settings.android.alarm !== AndroidNotificationSetting.DISABLED,
        fullScreenAllowed: AlarmDevice.canUseFullScreenIntent(),
        batteryOptimized: ignoringBattery === null ? batteryOptimized : !ignoringBattery,
        hasPowerManager: Boolean(powerManager?.activity),
        alarmVolume: volume && volume.max > 0 ? volume.current / volume.max : null,
    };
};

export const requestNotificationPermission = async () => {
    const settings = await notifee.requestPermission({ alert: true, badge: true, sound: true });
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
};

export const openAlarmSettings = {
    notifications: async () => {
        const allowed = await requestNotificationPermission().catch(() => false);
        if (!allowed) await notifee.openNotificationSettings(ALARM_CHANNEL_ID);
    },
    channel: () => notifee.openNotificationSettings(ALARM_CHANNEL_ID),
    exactAlarms: () => notifee.openAlarmPermissionSettings(),
    fullScreen: async () => {
        if (!AlarmDevice.openFullScreenIntentSettings()) await Linking.openSettings();
    },
    /** Retorna `true` se abriu o pedido direto do Android; `false` se caiu na lista de apps. */
    battery: async () => {
        if (AlarmDevice.requestIgnoreBatteryOptimizations()) return true;
        await notifee.openBatteryOptimizationSettings();
        return false;
    },
    powerManager: () => notifee.openPowerManagerSettings(),
    app: () => Linking.openSettings(),
};

type AlarmListener = () => void;
const alarmListeners = new Set<AlarmListener>();

/** Avisa a tela de alerta que um novo alarme tocou enquanto ela já estava aberta. */
export const subscribeToAlarmEvents = (listener: AlarmListener) => {
    alarmListeners.add(listener);
    return () => {
        alarmListeners.delete(listener);
    };
};

export const emitAlarmEvent = () => {
    alarmListeners.forEach((listener) => listener());
};
