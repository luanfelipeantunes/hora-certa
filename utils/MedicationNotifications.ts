import notifee, {
    AndroidCategory,
    AndroidImportance,
    AndroidVisibility,
    TriggerType
} from "@notifee/react-native";
import moment from "moment";
import { Platform } from "react-native";

// --- INÍCIO DO MOCK DO NOTIFEE ---
// let notifee: any;
// let TriggerType: any = { TIMESTAMP: 0 };
// let AndroidImportance: any = { HIGH: 4 };
// let AndroidVisibility: any = { PUBLIC: 1 };
// let AndroidCategory: any = { ALARM: 'alarm' };

// notifee = {
//     createChannel: async () => { },
//     cancelTriggerNotifications: async () => { },
//     createTriggerNotification: async () => "mock-id",
// };
// --- FIM DO MOCK DO NOTIFEE ---

export const MEDICATION_DATETIME_FORMAT = "YYYY-MM-DD HH:mm";
export const MEDICATION_NOTIFICATION_CHANNEL_ID = "medication-reminders";

const ensureNotificationChannel = async () => {
    if (Platform.OS !== "android" || !notifee) {
        return;
    }

    await notifee.createChannel({
        id: MEDICATION_NOTIFICATION_CHANNEL_ID,
        name: "Lembretes",
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC, // Garante que apareça na tela de bloqueio
        sound: "default",
        vibration: true,
        bypassDnd: true, // Fura o modo "Não Perturbe" e silencioso
    });
};

const getMedicationWindowEnd = (medication: any) => {
    return moment(medication?.startDate, "YYYY-MM-DD")
        .add(Number(medication?.duration || 0), "days")
        .endOf("day");
};

const getMedicationBaseOccurrence = (medication: any) => {
    const startDateTime = moment(`${medication?.startDate} ${medication?.startTime}`, MEDICATION_DATETIME_FORMAT);
    const lastUseDateTime = medication?.lastUse ? moment(medication.lastUse, MEDICATION_DATETIME_FORMAT) : null;
    const recurrence = Number(medication?.periodicity?.recurrency || 0);
    const unit = medication?.periodicity?.unit;

    if (!startDateTime.isValid() || !recurrence || !unit) {
        return null;
    }

    const nextOccurrence = lastUseDateTime?.isValid()
        ? lastUseDateTime.clone().add(recurrence, unit)
        : startDateTime.clone();

    return nextOccurrence.isValid() ? nextOccurrence : null;
};

export const getMedicationOccurrences = (medication: any, reference = moment()) => {
    const recurrence = Number(medication?.periodicity?.recurrency || 0);
    const unit = medication?.periodicity?.unit;
    const endDateTime = getMedicationWindowEnd(medication);
    const firstOccurrence = getMedicationBaseOccurrence(medication);

    if (!firstOccurrence || !recurrence || !unit || !endDateTime.isValid()) {
        return [];
    }

    const occurrences: moment.Moment[] = [];
    const nextOccurrence = firstOccurrence.clone();

    while (nextOccurrence.isBefore(reference)) {
        nextOccurrence.add(recurrence, unit);
    }

    while (nextOccurrence.isSameOrBefore(endDateTime)) {
        occurrences.push(nextOccurrence.clone());
        nextOccurrence.add(recurrence, unit);
    }

    return occurrences;
};

export const getNextMedication = (storedMedications: any[]) => {
    const now = moment();
    const upcomingOccurrences = storedMedications.flatMap((medication) =>
        getMedicationOccurrences(medication, now)
            .map((occurrence) => ({ medication, occurrence }))
    );

    if (upcomingOccurrences.length === 0) {
        return null;
    }

    upcomingOccurrences.sort((a, b) => a.occurrence.valueOf() - b.occurrence.valueOf());

    return upcomingOccurrences[0];
};

const cancelMedicationNotifications = async (medication: any) => {
    if (!notifee) {
        return;
    }

    const notificationIds = Array.isArray(medication?.notificationIds)
        ? medication.notificationIds
        : medication?.notificationId
            ? [medication.notificationId]
            : [];

    if (notificationIds.length > 0) {
        try {
            await notifee.cancelTriggerNotifications(notificationIds);
        } catch (error) {
            console.warn("Failed to cancel scheduled medication notifications", error);
        }
    }
};

const scheduleMedicationOccurrence = async (medication: any, occurrence: moment.Moment) => {
    await ensureNotificationChannel();

    // Garante que o ID da notificação seja único para essa ocorrência
    const notificationId = `med_${medication?.id}_${occurrence.valueOf()}`;

    const notification = {
        id: notificationId,
        title: "⏰ Hora da medicação",
        body: `${medication?.name || "Seu remédio"} deve ser tomado agora.`,
        android: {
            channelId: MEDICATION_NOTIFICATION_CHANNEL_ID,
            category: AndroidCategory.ALARM,
            loopSound: true, 
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            ongoing: true,
            autocancel: false,
            pressAction: {
                id: "default",
            },
            fullScreenAction: {
                id: "default", // Acorda a tela e chama o app
                launchActivity: "default"
            },
            sound: "default",
        },
        ios: {
            interruptionLevel: "timeSensitive" as const, // Fura o modo foco no iOS
            sound: "default",
        },
        data: {
            medicationId: medication?.id,
            medicationOccurrence: occurrence.format(MEDICATION_DATETIME_FORMAT),
        },
    };

    await notifee.createTriggerNotification(notification, {
        type: TriggerType.TIMESTAMP,
        timestamp: occurrence.valueOf(),
        alarmManager: Platform.OS === "android"
    });

    return notificationId;
};

export const syncMedicationNotifications = async (medications: any[]) => {
    const updatedMedications = [];

    for (const medication of medications) {
        await cancelMedicationNotifications(medication);

        const occurrences = getMedicationOccurrences(medication);
        const notificationIds: string[] = [];

        for (const occurrence of occurrences) {
            const notificationId = await scheduleMedicationOccurrence(medication, occurrence);

            if (notificationId) {
                notificationIds.push(notificationId);
            }
        }

        updatedMedications.push({
            ...medication,
            notificationId: notificationIds[0] || null,
            notificationIds,
        });
    }

    return updatedMedications;
};

export const markMedicationAsTaken = (medications: any[], medicationId: string) => {
    const now = moment().format(MEDICATION_DATETIME_FORMAT);

    return medications.map((medication) => {
        if (medication?.id !== medicationId) {
            return medication;
        }

        return {
            ...medication,
            lastUse: now,
        };
    });
};