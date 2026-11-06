/**
 * Validação e migração dos dados salvos (funções puras, testáveis sem o React Native).
 * Aceita também o formato da versão anterior do app (notificationId/notificationIds etc.).
 */
import { isColorId, isShapeId } from "@/constants/medication";
import type { DoseRef, Medication, Snooze } from "@/types/medication";
import { DATE_FORMAT, DATETIME_FORMAT, moment } from "./date";

export const isValidDateTime = (value: unknown) =>
    typeof value === "string" && moment(value, DATETIME_FORMAT, true).isValid();

const normalizeTime = (value: unknown) => {
    const parsed = moment(String(value ?? ""), ["HH:mm", "H:mm"], true);
    return parsed.isValid() ? parsed.format("HH:mm") : null;
};

export const normalizeMedication = (raw: any): Medication | null => {
    if (!raw || typeof raw !== "object") return null;

    const id = raw.id != null ? String(raw.id) : "";
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const startTime = normalizeTime(raw.startTime);
    const startDate = moment(String(raw.startDate ?? ""), DATE_FORMAT, true);
    const recurrency = Math.floor(Number(raw.periodicity?.recurrency));
    const unit = raw.periodicity?.unit;

    if (!id || !name || !startTime || !startDate.isValid()) return null;
    if (!Number.isFinite(recurrency) || recurrency < 1) return null;
    if (unit !== "hours" && unit !== "days") return null;

    const durationNumber = Math.floor(Number(raw.duration));
    const duration =
        raw.duration === null || raw.duration === undefined
            ? null
            : Number.isFinite(durationNumber) && durationNumber > 0
                ? durationNumber
                : 1;

    const takenDoses: string[] = Array.isArray(raw.takenDoses)
        ? raw.takenDoses.filter(isValidDateTime)
        : [];

    const createdAt = isValidDateTime(raw.createdAt)
        ? raw.createdAt
        : /^\d{13}$/.test(id)
            ? moment(Number(id)).format(DATETIME_FORMAT)
            : moment().format(DATETIME_FORMAT);

    return {
        id,
        name,
        description: typeof raw.description === "string" ? raw.description.trim() : "",
        shape: isShapeId(raw.shape) ? raw.shape : "circle",
        color: isColorId(raw.color) ? raw.color : "blue",
        startDate: startDate.format(DATE_FORMAT),
        startTime,
        periodicity: { recurrency, unit },
        duration,
        takenDoses,
        lastUse: isValidDateTime(raw.lastUse) ? raw.lastUse : null,
        createdAt,
    };
};

export const normalizeSnooze = (raw: any): Snooze | null => {
    if (!raw || typeof raw !== "object") return null;

    const timestamp = Number(raw.timestamp);
    const items: DoseRef[] = Array.isArray(raw.items)
        ? raw.items
            .filter((item: any) => item && typeof item.medicationId === "string" && isValidDateTime(item.occurrence))
            .map((item: any) => ({ medicationId: item.medicationId, occurrence: item.occurrence }))
        : [];

    if (!raw.id || !Number.isFinite(timestamp) || items.length === 0) return null;

    return { id: String(raw.id), timestamp, items };
};
