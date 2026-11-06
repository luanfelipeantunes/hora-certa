/**
 * Testes das regras de horário. Rodar com: npm test
 * (usa o executor de testes nativo do Node via tsx, sem dependências do React Native)
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Medication } from "../../types/medication";
import { moment } from "../date";
import { normalizeMedication } from "../normalize";
import {
    countDoses,
    getDailyTimes,
    getLastOccurrence,
    getMedicationStatus,
    getOccurrences,
    getOverdueDoses,
    getUpcomingSlots,
    resolvePendingDoses,
} from "../schedule";

const med = (overrides: Partial<Medication> = {}): Medication => ({
    id: "1",
    name: "Remédio",
    description: "",
    shape: "circle",
    color: "red",
    startDate: "2026-11-05",
    startTime: "08:00",
    periodicity: { recurrency: 8, unit: "hours" },
    duration: 7,
    takenDoses: [],
    lastUse: null,
    createdAt: "2026-11-05 07:00",
    ...overrides,
});

const at = (value: string) => moment(value, "YYYY-MM-DD HH:mm");
const keys = (list: moment.Moment[]) => list.map((item) => item.format("YYYY-MM-DD HH:mm"));

describe("grade de horários", () => {
    it("segue a grade fixa a partir da primeira dose", () => {
        const result = getOccurrences(med(), at("2026-11-05 00:00"), at("2026-11-06 12:00"));
        assert.deepEqual(keys(result), ["2026-11-05 08:00", "2026-11-05 16:00", "2026-11-06 00:00", "2026-11-06 08:00"]);
    });

    it("confirmar com atraso não muda os próximos horários", () => {
        const late = med({ lastUse: "2026-11-05 08:40", takenDoses: ["2026-11-05 08:00"] });
        const [next] = getOccurrences(late, at("2026-11-05 09:00"), at("2026-11-06 00:00"));
        assert.equal(next.format("HH:mm"), "16:00");
    });

    it("7 dias de 8 em 8 horas = 21 doses (sem dia a mais)", () => {
        assert.equal(countDoses(med()), 21);
        assert.equal(getLastOccurrence(med())?.format("YYYY-MM-DD HH:mm"), "2026-11-12 00:00");
    });

    it("1 vez ao dia por 7 dias = 7 doses", () => {
        assert.equal(countDoses(med({ periodicity: { recurrency: 1, unit: "days" } })), 7);
    });

    it("uso contínuo não tem fim", () => {
        const continuous = med({ duration: null, periodicity: { recurrency: 1, unit: "days" } });
        assert.equal(countDoses(continuous), null);
        assert.equal(getOccurrences(continuous, at("2030-01-01 00:00"), at("2030-01-03 00:00")).length, 2);
    });

    it("pula direto para perto da data pedida sem perder doses", () => {
        const hourly = med({ periodicity: { recurrency: 1, unit: "hours" }, duration: null });
        const result = getOccurrences(hourly, at("2027-03-10 10:30"), at("2027-03-10 13:00"));
        assert.deepEqual(keys(result), ["2027-03-10 11:00", "2027-03-10 12:00"]);
    });

    it("dados inválidos não geram doses", () => {
        assert.equal(getOccurrences(med({ periodicity: { recurrency: 0, unit: "hours" } }), at("2026-11-05 00:00"), at("2026-11-06 00:00")).length, 0);
        assert.equal(getOccurrences(med({ startTime: "25:00" }), at("2026-11-05 00:00"), at("2026-11-06 00:00")).length, 0);
    });

    it("horários do dia", () => {
        assert.deepEqual(getDailyTimes(med()), ["00:00", "08:00", "16:00"]);
        assert.equal(getDailyTimes(med({ periodicity: { recurrency: 5, unit: "hours" } })), null);
        assert.equal(getDailyTimes(med({ periodicity: { recurrency: 1, unit: "hours" } })), null);
    });

    it("status do tratamento", () => {
        assert.equal(getMedicationStatus(med(), at("2026-11-04 10:00")), "scheduled");
        assert.equal(getMedicationStatus(med(), at("2026-11-08 10:00")), "active");
        assert.equal(getMedicationStatus(med(), at("2026-11-20 10:00")), "finished");
    });
});

describe("alarmes", () => {
    it("remédios no mesmo horário viram um único alarme", () => {
        const a = med({ id: "a", name: "A" });
        const b = med({ id: "b", name: "B", periodicity: { recurrency: 1, unit: "days" } });
        const [first, second] = getUpcomingSlots([a, b], at("2026-11-05 07:00"), 10);
        assert.equal(first.key, "2026-11-05 08:00");
        assert.deepEqual(first.doses.map((dose) => dose.medication.id), ["a", "b"]);
        assert.equal(second.doses.length, 1);
    });

    it("respeita o limite de alarmes agendados", () => {
        const hourly = med({ periodicity: { recurrency: 1, unit: "hours" }, duration: 30 });
        assert.equal(getUpcomingSlots([hourly], at("2026-11-05 07:00"), 120).length, 120);
    });

    it("não agenda dose já confirmada", () => {
        const taken = med({ takenDoses: ["2026-11-05 08:00"] });
        const [slot] = getUpcomingSlots([taken], at("2026-11-05 07:00"), 5);
        assert.equal(slot.key, "2026-11-05 16:00");
    });

    it("dose atrasada: só a mais recente de cada remédio", () => {
        const hourly = med({ periodicity: { recurrency: 1, unit: "hours" } });
        const overdue = getOverdueDoses([hourly], at("2026-11-05 10:30"));
        assert.deepEqual(overdue.map((dose) => dose.key), ["2026-11-05 10:00"]);
    });

    it("tela de alerta ignora remédio excluído e dose já confirmada", () => {
        const a = med({ id: "a", takenDoses: ["2026-11-05 08:00"] });
        const b = med({ id: "b" });
        const pending = resolvePendingDoses(
            [
                { medicationId: "a", occurrence: "2026-11-05 08:00" },
                { medicationId: "b", occurrence: "2026-11-05 08:00" },
                { medicationId: "excluido", occurrence: "2026-11-05 08:00" },
            ],
            [a, b]
        );
        assert.deepEqual(pending.map((dose) => dose.medication.id), ["b"]);
    });
});

describe("migração dos dados antigos", () => {
    it("aceita o formato da versão anterior", () => {
        const migrated = normalizeMedication({
            id: "1762300000000",
            name: " Paracetamol ",
            description: "1 comprimido",
            periodicity: { recurrency: 8, unit: "hours" },
            startTime: "08:00",
            startDate: "2026-11-05",
            lastUse: "2026-11-05 08:10",
            shape: "triangle",
            color: "blue",
            duration: 7,
            notificationId: "med_1_123",
            notificationIds: ["med_1_123"],
        });
        assert.ok(migrated);
        assert.equal(migrated.name, "Paracetamol");
        assert.equal(migrated.duration, 7);
        assert.deepEqual(migrated.takenDoses, []);
        assert.equal("notificationIds" in migrated, false);
    });

    it("descarta registros quebrados", () => {
        assert.equal(normalizeMedication({ id: "1", name: "X" }), null);
        assert.equal(normalizeMedication(null), null);
    });
});
