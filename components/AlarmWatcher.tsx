import notifee, { EventType } from "@notifee/react-native";
import { usePathname, useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
    alarmToParams,
    emitAlarmEvent,
    getActiveAlarms,
    parseAlarm,
    requestNotificationPermission,
    syncAlarms,
    syncAlarmsThrottled,
    type ActiveAlarm,
} from "@/utils/alarms";
import { mutateData } from "@/utils/storage";

const ALARM_PATH = "/alarm";

/**
 * Fica montado o tempo todo e leva o usuário para a tela de alerta quando um alarme toca:
 * - app aberto do zero pelo alarme (tela bloqueada / notificação tocada);
 * - app voltando do segundo plano com um alarme tocando;
 * - alarme disparando com o app aberto.
 * Também mantém a agenda de alarmes em dia.
 */
export default function AlarmWatcher() {
    const router = useRouter();
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    const navigationState = useRootNavigationState();
    const navigationReady = Boolean(navigationState?.key);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        if (!navigationReady) return;

        let active = true;

        const openAlarmScreen = (alarm: ActiveAlarm) => {
            if (!active) return;

            if (pathnameRef.current === ALARM_PATH) {
                emitAlarmEvent();
                return;
            }

            pathnameRef.current = ALARM_PATH;
            router.push({ pathname: ALARM_PATH, params: alarmToParams(alarm) });
        };

        const checkActiveAlarms = async () => {
            try {
                const [alarm] = await getActiveAlarms();
                if (alarm) openAlarmScreen(alarm);
            } catch (error) {
                console.warn("[AlarmWatcher] falha ao verificar alarmes ativos", error);
            }
        };

        const bootstrap = async () => {
            try {
                const initial = await notifee.getInitialNotification();
                const alarm = initial ? parseAlarm(initial.notification.id, initial.notification.data) : null;

                if (alarm) openAlarmScreen(alarm);
                else await checkActiveAlarms();
            } catch (error) {
                console.warn("[AlarmWatcher] falha ao ler a notificação inicial", error);
            }

            try {
                await requestNotificationPermission();
            } catch (error) {
                console.warn("[AlarmWatcher] falha ao pedir permissão de notificação", error);
            }

            try {
                // Regrava os dados no formato atual (migra registros da versão anterior)
                // e refaz a agenda, removendo alarmes antigos que ficaram presos no sistema.
                await mutateData((data) => data);
                await syncAlarms();
            } catch (error) {
                console.warn("[AlarmWatcher] falha ao sincronizar alarmes", error);
            }
        };

        bootstrap();

        const appStateSubscription = AppState.addEventListener("change", (state) => {
            if (state !== "active") return;

            checkActiveAlarms();
            syncAlarmsThrottled().catch((error) =>
                console.warn("[AlarmWatcher] falha ao sincronizar alarmes", error)
            );
        });

        const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
            if (type !== EventType.DELIVERED && type !== EventType.PRESS) return;

            const alarm = parseAlarm(detail.notification?.id, detail.notification?.data);
            if (!alarm) return;

            openAlarmScreen(alarm);

            if (type === EventType.DELIVERED && alarm.kind === "medication") {
                syncAlarms().catch((error) =>
                    console.warn("[AlarmWatcher] falha ao sincronizar alarmes", error)
                );
            }
        });

        return () => {
            active = false;
            appStateSubscription.remove();
            unsubscribeForeground();
        };
    }, [navigationReady, router]);

    return null;
}
