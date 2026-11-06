export type ShapeId = "circle" | "square" | "triangle" | "star" | "heart" | "diamond";

export type ColorId =
    | "red"
    | "blue"
    | "yellow"
    | "green"
    | "orange"
    | "purple"
    | "pink"
    | "black";

export type PeriodUnit = "hours" | "days";

export type Medication = {
    id: string;
    name: string;
    /** Como tomar (ex.: "1 comprimido com água"). */
    description: string;
    shape: ShapeId;
    color: ColorId;
    /** Data da primeira dose, "YYYY-MM-DD". */
    startDate: string;
    /** Hora da primeira dose, "HH:mm". */
    startTime: string;
    periodicity: {
        recurrency: number;
        unit: PeriodUnit;
    };
    /** Duração do tratamento em dias. `null` = uso contínuo. */
    duration: number | null;
    /** Doses confirmadas, no formato "YYYY-MM-DD HH:mm" (horário previsto da dose). */
    takenDoses: string[];
    /** Quando a última dose foi confirmada, "YYYY-MM-DD HH:mm". */
    lastUse: string | null;
    createdAt: string;
};

/** Referência a uma dose específica de um remédio. */
export type DoseRef = {
    medicationId: string;
    /** Horário previsto da dose, "YYYY-MM-DD HH:mm". */
    occurrence: string;
};

/** Alarme adiado ("lembrar daqui a 10 minutos"). */
export type Snooze = {
    id: string;
    timestamp: number;
    items: DoseRef[];
};
