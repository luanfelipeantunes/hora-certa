/**
 * Ações do usuário que alteram os dados e, em seguida, reagendam os alarmes.
 *
 * Se o reagendamento falhar, os dados continuam salvos: a próxima sincronização
 * (ao abrir o app, por exemplo) tenta de novo. Por isso essas funções retornam
 * `alarmsOk` em vez de lançar erro nesse caso.
 */
import type { DoseRef, Medication } from "@/types/medication";
import { syncAlarms, SNOOZE_MINUTES } from "./alarms";
import { DATETIME_FORMAT, moment } from "./date";
import { mutateData } from "./storage";

const sameDose = (a: DoseRef, b: DoseRef) =>
    a.medicationId === b.medicationId && a.occurrence === b.occurrence;

const syncSafely = async () => {
    try {
        const result = await syncAlarms();
        return result.failed === 0;
    } catch (error) {
        console.warn("[medicationActions] falha ao reagendar alarmes", error);
        return false;
    }
};

export const createMedicationId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const saveMedication = async (medication: Medication) => {
    await mutateData((data) => {
        const exists = data.medications.some((item) => item.id === medication.id);
        return {
            ...data,
            medications: exists
                ? data.medications.map((item) => (item.id === medication.id ? medication : item))
                : [...data.medications, medication],
        };
    });

    return { alarmsOk: await syncSafely() };
};

export const deleteMedication = async (medicationId: string) => {
    await mutateData((data) => ({
        medications: data.medications.filter((item) => item.id !== medicationId),
        snoozes: data.snoozes.map((snooze) => ({
            ...snooze,
            items: snooze.items.filter((item) => item.medicationId !== medicationId),
        })),
    }));

    return { alarmsOk: await syncSafely() };
};

export const markDosesTaken = async (doses: DoseRef[]) => {
    const now = moment().format(DATETIME_FORMAT);

    await mutateData((data) => ({
        medications: data.medications.map((medication) => {
            const keys = doses
                .filter((dose) => dose.medicationId === medication.id)
                .map((dose) => dose.occurrence);

            if (keys.length === 0) return medication;

            return {
                ...medication,
                takenDoses: [...new Set([...medication.takenDoses, ...keys])],
                lastUse: now,
            };
        }),
        // Uma dose confirmada não precisa mais do lembrete adiado.
        snoozes: data.snoozes.map((snooze) => ({
            ...snooze,
            items: snooze.items.filter((item) => !doses.some((dose) => sameDose(dose, item))),
        })),
    }));

    return { alarmsOk: await syncSafely() };
};

export const unmarkDoseTaken = async (dose: DoseRef) => {
    await mutateData((data) => ({
        ...data,
        medications: data.medications.map((medication) =>
            medication.id === dose.medicationId
                ? { ...medication, takenDoses: medication.takenDoses.filter((key) => key !== dose.occurrence) }
                : medication
        ),
    }));

    return { alarmsOk: await syncSafely() };
};

/** Adia o alarme das doses informadas. Retorna o horário do novo alarme. */
export const snoozeDoses = async (doses: DoseRef[], minutes = SNOOZE_MINUTES) => {
    const timestamp = moment().add(minutes, "minutes").startOf("minute").valueOf();

    await mutateData((data) => ({
        ...data,
        snoozes: [
            // Remove adiamentos anteriores dessas mesmas doses para não tocar duas vezes.
            ...data.snoozes.map((snooze) => ({
                ...snooze,
                items: snooze.items.filter((item) => !doses.some((dose) => sameDose(dose, item))),
            })),
            { id: String(timestamp), timestamp, items: doses },
        ],
    }));

    return { timestamp, alarmsOk: await syncSafely() };
};
