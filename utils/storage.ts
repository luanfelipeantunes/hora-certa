/**
 * Persistência local (AsyncStorage) dos remédios e dos alarmes adiados.
 *
 * - Toda leitura passa por `normalizeMedication` (utils/normalize.ts), que também migra o formato antigo do app
 *   (campos notificationId/notificationIds, duração obrigatória, etc.).
 * - Toda escrita passa por `mutateData`, que serializa as operações para que duas telas
 *   (ou o alarme em segundo plano) não sobrescrevam as alterações uma da outra.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Medication, Snooze } from "@/types/medication";
import { DATETIME_FORMAT, moment } from "./date";
import { normalizeMedication, normalizeSnooze } from "./normalize";

const MEDICATIONS_KEY = "medications";
const SNOOZES_KEY = "alarm-snoozes";

/** Mantém o histórico de doses confirmadas enxuto. */
const TAKEN_HISTORY_DAYS = 60;

export type AppData = {
    medications: Medication[];
    snoozes: Snooze[];
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** Avisa as telas abertas que os dados mudaram. */
export const subscribeToDataChanges = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const notifyDataChanged = () => {
    listeners.forEach((listener) => {
        try {
            listener();
        } catch (error) {
            console.warn("[storage] listener falhou", error);
        }
    });
};

const readJsonArray = async (key: string): Promise<any[]> => {
    try {
        const stored = await AsyncStorage.getItem(key);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn(`[storage] não foi possível ler "${key}"`, error);
        return [];
    }
};

export const loadData = async (): Promise<AppData> => {
    const [rawMedications, rawSnoozes] = await Promise.all([
        readJsonArray(MEDICATIONS_KEY),
        readJsonArray(SNOOZES_KEY),
    ]);

    return {
        medications: rawMedications
            .map(normalizeMedication)
            .filter((medication): medication is Medication => medication !== null),
        snoozes: rawSnoozes
            .map(normalizeSnooze)
            .filter((snooze): snooze is Snooze => snooze !== null),
    };
};

const pruneData = ({ medications, snoozes }: AppData): AppData => {
    const historyLimit = moment().subtract(TAKEN_HISTORY_DAYS, "days").format(DATETIME_FORMAT);
    const snoozeLimit = Date.now() - 60 * 60 * 1000;
    const medicationIds = new Set(medications.map((medication) => medication.id));

    return {
        medications: medications.map((medication) => ({
            ...medication,
            // O formato "YYYY-MM-DD HH:mm" pode ser comparado como texto.
            takenDoses: [...new Set(medication.takenDoses)].filter((key) => key >= historyLimit).sort(),
        })),
        snoozes: snoozes
            .map((snooze) => ({
                ...snooze,
                items: snooze.items.filter((item) => medicationIds.has(item.medicationId)),
            }))
            .filter((snooze) => snooze.items.length > 0 && snooze.timestamp >= snoozeLimit),
    };
};

let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * Lê, altera e grava os dados de forma atômica (uma alteração por vez).
 * Não chame `mutateData` de dentro de outro `mutateData`: isso travaria a fila.
 */
export const mutateData = (
    update: (data: AppData) => AppData | Promise<AppData>
): Promise<AppData> => {
    const run = writeQueue.then(async () => {
        const current = await loadData();
        const next = pruneData(await update(current));

        await AsyncStorage.multiSet([
            [MEDICATIONS_KEY, JSON.stringify(next.medications)],
            [SNOOZES_KEY, JSON.stringify(next.snoozes)],
        ]);

        return next;
    });

    writeQueue = run.catch(() => undefined);

    return run.then((data) => {
        notifyDataChanged();
        return data;
    });
};
