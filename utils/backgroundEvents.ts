import { EventType, type Event } from "@notifee/react-native";
import { parseAlarm, syncAlarms } from "./alarms";

/**
 * Eventos do notifee com o app fechado ou em segundo plano.
 * Quando um alarme toca, aproveita para completar a agenda dos próximos alarmes.
 * (A abertura da tela de alerta é feita pelo próprio Android via fullScreenAction/pressAction.)
 */
export const handleBackgroundEvent = async ({ type, detail }: Event) => {
    if (type !== EventType.DELIVERED) return;

    const alarm = parseAlarm(detail.notification?.id, detail.notification?.data);
    if (!alarm || alarm.kind !== "medication") return;

    try {
        await syncAlarms();
    } catch (error) {
        console.warn("[backgroundEvents] falha ao reagendar alarmes", error);
    }
};
