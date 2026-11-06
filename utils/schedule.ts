/**
 * Regras de horário dos remédios (funções puras, sem acesso a armazenamento ou notificações).
 *
 * Os horários seguem uma grade FIXA a partir da primeira dose cadastrada:
 * "a cada 8 horas a partir de 08:00" => 08:00, 16:00, 00:00, 08:00...
 * Confirmar uma dose com atraso não empurra as próximas.
 */
import type { DoseRef, Medication, PeriodUnit } from "@/types/medication";
import { DATETIME_FORMAT, moment, type Moment } from "./date";

type ScheduleFields = Pick<Medication, "startDate" | "startTime" | "periodicity" | "duration">;

export type Dose = {
    medication: Medication;
    time: Moment;
    /** Horário previsto, "YYYY-MM-DD HH:mm". */
    key: string;
    taken: boolean;
};

export type DoseSlot = {
    time: Moment;
    key: string;
    doses: Dose[];
};

export type MedicationStatus = "scheduled" | "active" | "finished";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const toKey = (time: Moment) => time.format(DATETIME_FORMAT);

export const fromKey = (key: string) => moment(key, DATETIME_FORMAT, true);

export const getStartMoment = (medication: Pick<Medication, "startDate" | "startTime">) => {
    const start = moment(`${medication.startDate} ${medication.startTime}`, DATETIME_FORMAT, true);
    return start.isValid() ? start : null;
};

export const getStep = (medication: Pick<Medication, "periodicity">) => {
    const amount = Math.floor(Number(medication.periodicity?.recurrency));
    const unit = medication.periodicity?.unit;

    if (!Number.isFinite(amount) || amount < 1) return null;
    if (unit !== "hours" && unit !== "days") return null;

    return { amount, unit } as { amount: number; unit: PeriodUnit };
};

/** Fim do tratamento (exclusivo). `null` quando é uso contínuo ou os dados são inválidos. */
export const getEndMoment = (medication: ScheduleFields) => {
    if (medication.duration == null) return null;

    const start = getStartMoment(medication);
    if (!start) return null;

    return start.clone().add(Math.max(1, Math.floor(medication.duration)), "days");
};

/** Doses previstas no intervalo [from, to). */
export const getOccurrences = (
    medication: ScheduleFields,
    from: Moment,
    to: Moment,
    limit = 2000
): Moment[] => {
    const start = getStartMoment(medication);
    const step = getStep(medication);

    if (!start || !step || !to.isAfter(from)) return [];

    const end = getEndMoment(medication);
    const upper = end && end.isBefore(to) ? end : to;
    const at = (index: number) => start.clone().add(index * step.amount, step.unit);

    // Pula direto para perto de "from" em vez de iterar desde o início do tratamento.
    let index = 0;
    if (from.isAfter(start)) {
        const stepMs = step.amount * (step.unit === "hours" ? HOUR_MS : DAY_MS);
        index = Math.max(0, Math.floor((from.valueOf() - start.valueOf()) / stepMs) - 1);
    }

    let current = at(index);
    while (current.isBefore(from)) {
        index += 1;
        current = at(index);
    }

    const result: Moment[] = [];
    while (current.isBefore(upper) && result.length < limit) {
        result.push(current);
        index += 1;
        current = at(index);
    }

    return result;
};

export const isDoseTaken = (medication: Medication, key: string) =>
    medication.takenDoses.includes(key);

const compareDoses = (a: Dose, b: Dose) =>
    a.time.valueOf() - b.time.valueOf() || a.medication.name.localeCompare(b.medication.name);

/** Todas as doses de todos os remédios no intervalo [from, to), em ordem de horário. */
export const getDoses = (
    medications: Medication[],
    from: Moment,
    to: Moment,
    limitPerMedication?: number
): Dose[] =>
    medications
        .flatMap((medication) =>
            getOccurrences(medication, from, to, limitPerMedication).map((time) => {
                const key = toKey(time);
                return { medication, time, key, taken: isDoseTaken(medication, key) };
            })
        )
        .sort(compareDoses);

/** Agrupa doses do mesmo horário (um único alarme para vários remédios). */
export const groupBySlot = (doses: Dose[]): DoseSlot[] => {
    const slots = new Map<string, DoseSlot>();

    for (const dose of doses) {
        const slot = slots.get(dose.key);
        if (slot) {
            slot.doses.push(dose);
        } else {
            slots.set(dose.key, { time: dose.time, key: dose.key, doses: [dose] });
        }
    }

    return [...slots.values()].sort((a, b) => a.time.valueOf() - b.time.valueOf());
};

/** Próximos horários com algum remédio ainda não tomado. Usado para agendar os alarmes. */
export const getUpcomingSlots = (
    medications: Medication[],
    from: Moment,
    maxSlots: number,
    horizonDays = 45
): DoseSlot[] => {
    if (maxSlots <= 0) return [];

    const to = from.clone().add(horizonDays, "days");
    const doses = getDoses(medications, from, to, maxSlots).filter((dose) => !dose.taken);

    return groupBySlot(doses).slice(0, maxSlots);
};

/**
 * Doses atrasadas (já passaram e não foram confirmadas) dentro da janela informada.
 * Mantém só a mais recente de cada remédio, para nunca sugerir tomar duas doses juntas.
 */
export const getOverdueDoses = (medications: Medication[], now: Moment, windowHours = 3): Dose[] => {
    const from = now.clone().subtract(windowHours, "hours");
    const to = now.clone().add(1, "second");
    const latestByMedication = new Map<string, Dose>();

    for (const dose of getDoses(medications, from, to)) {
        if (!dose.taken) latestByMedication.set(dose.medication.id, dose);
    }

    return [...latestByMedication.values()].sort(compareDoses);
};

/**
 * Converte as doses de um alarme em doses pendentes: ignora remédios excluídos e doses já
 * confirmadas e mantém só a mais recente de cada remédio.
 */
export const resolvePendingDoses = (refs: DoseRef[], medications: Medication[]): Dose[] => {
    const latestByMedication = new Map<string, Dose>();

    for (const ref of refs) {
        const medication = medications.find((item) => item.id === ref.medicationId);
        const time = fromKey(ref.occurrence);

        if (!medication || !time.isValid() || isDoseTaken(medication, ref.occurrence)) continue;

        const current = latestByMedication.get(medication.id);
        if (!current || time.isAfter(current.time)) {
            latestByMedication.set(medication.id, { medication, time, key: ref.occurrence, taken: false });
        }
    }

    return [...latestByMedication.values()].sort(compareDoses);
};

/** Última dose do tratamento (`null` para uso contínuo). */
export const getLastOccurrence = (medication: ScheduleFields) => {
    const start = getStartMoment(medication);
    const step = getStep(medication);
    const end = getEndMoment(medication);

    if (!start || !step || !end) return null;

    const from = moment.max(start, end.clone().subtract(step.amount * 2, step.unit));
    const occurrences = getOccurrences(medication, from, end);

    return occurrences[occurrences.length - 1] ?? null;
};

/** Quantidade total de doses do tratamento (`null` para uso contínuo). */
export const countDoses = (medication: ScheduleFields) => {
    const start = getStartMoment(medication);
    const end = getEndMoment(medication);

    if (!start || !end) return null;

    return getOccurrences(medication, start, end, 100000).length;
};

export const getMedicationStatus = (medication: Medication, now: Moment): MedicationStatus => {
    const start = getStartMoment(medication);

    if (!start || !getStep(medication)) return "finished";
    if (start.isAfter(now)) return "scheduled";

    const last = getLastOccurrence(medication);
    if (last && now.isAfter(last.clone().add(2, "hours"))) return "finished";

    return "active";
};

/**
 * Horários do dia, quando se repetem igualmente todo dia ("08:00", "16:00", "00:00" -> ordenados).
 * Retorna `null` quando o intervalo não divide o dia (ex.: a cada 5 horas) ou dá mais de 6 horários.
 */
export const getDailyTimes = (medication: ScheduleFields): string[] | null => {
    const start = getStartMoment(medication);
    const step = getStep(medication);

    if (!start || !step) return null;
    if (step.unit === "days") return [start.format("HH:mm")];
    // Intervalos curtos (ex.: de 1 em 1 hora) gerariam uma lista longa demais para ler.
    if (24 % step.amount !== 0 || 24 / step.amount > 6) return null;

    return Array.from({ length: 24 / step.amount }, (_, index) =>
        start.clone().add(index * step.amount, "hours").format("HH:mm")
    ).sort();
};

export const describeFrequency = (recurrency: number, unit: PeriodUnit) => {
    if (unit === "days") {
        return recurrency === 1 ? "1 vez ao dia" : `A cada ${recurrency} dias`;
    }
    return recurrency === 1 ? "A cada 1 hora" : `A cada ${recurrency} horas`;
};
