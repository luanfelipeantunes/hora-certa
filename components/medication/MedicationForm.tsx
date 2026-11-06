import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import AppText from "@/components/ui/AppText";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ChoiceChip } from "@/components/ui/Chip";
import DateTimeField from "@/components/ui/DateTimeField";
import Screen from "@/components/ui/Screen";
import SectionTitle, { FieldLabel } from "@/components/ui/SectionTitle";
import SegmentedControl from "@/components/ui/SegmentedControl";
import TextField from "@/components/ui/TextField";
import { describeSymbol, describeSymbolWithArticle } from "@/constants/medication";
import { colors, spacing } from "@/constants/theme";
import { useNow } from "@/hooks/useNow";
import type { ColorId, Medication, PeriodUnit, ShapeId } from "@/types/medication";
import { DATE_FORMAT, DATETIME_FORMAT, formatDayLabel, formatList, moment } from "@/utils/date";
import { createMedicationId, saveMedication } from "@/utils/medicationActions";
import {
    countDoses,
    describeFrequency,
    getDailyTimes,
    getLastOccurrence,
    getMedicationStatus,
    getOccurrences,
} from "@/utils/schedule";
import MedicationSymbol from "./MedicationSymbol";
import { ColorPicker, ShapePicker } from "./SymbolPickers";

type MedicationFormProps = {
    /** Remédio sendo editado (vazio = novo). */
    medication?: Medication;
    /** Outros remédios, para evitar dois com o mesmo símbolo. */
    otherMedications: Medication[];
};

const QUICK_FREQUENCIES: { label: string; recurrency: number; unit: PeriodUnit }[] = [
    { label: "6 em 6 h", recurrency: 6, unit: "hours" },
    { label: "8 em 8 h", recurrency: 8, unit: "hours" },
    { label: "12 em 12 h", recurrency: 12, unit: "hours" },
    { label: "1 vez ao dia", recurrency: 1, unit: "days" },
];

const LIMITS = {
    hours: 72,
    days: 30,
    duration: 365,
    name: 60,
    description: 120,
};

const onlyDigits = (text: string) => text.replace(/\D/g, "");

const nextFullHour = () => moment().add(1, "hour").startOf("hour");

export default function MedicationForm({ medication, otherMedications }: MedicationFormProps) {
    const router = useRouter();
    const now = useNow();
    const isEditing = Boolean(medication);
    // O ID é definido na abertura do formulário: assim o remédio recém-salvo não é
    // confundido com "outro remédio usando o mesmo símbolo".
    const [medicationId] = useState(() => medication?.id ?? createMedicationId());

    const [name, setName] = useState(medication?.name ?? "");
    const [description, setDescription] = useState(medication?.description ?? "");
    const [shape, setShape] = useState<ShapeId | null>(medication?.shape ?? null);
    const [color, setColor] = useState<ColorId | null>(medication?.color ?? null);
    const [recurrency, setRecurrency] = useState(medication ? String(medication.periodicity.recurrency) : "");
    const [unit, setUnit] = useState<PeriodUnit>(medication?.periodicity.unit ?? "hours");
    const [startDate, setStartDate] = useState(medication?.startDate ?? moment().format(DATE_FORMAT));
    const [startTime, setStartTime] = useState(medication?.startTime ?? nextFullHour().format("HH:mm"));
    const [continuous, setContinuous] = useState(medication ? medication.duration == null : false);
    const [duration, setDuration] = useState(medication?.duration != null ? String(medication.duration) : "");
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    const recurrencyNumber = Number(recurrency);
    const durationNumber = Number(duration);

    const draft = useMemo(
        () => ({
            startDate,
            startTime,
            periodicity: { recurrency: recurrencyNumber, unit },
            duration: continuous ? null : durationNumber,
        }),
        [startDate, startTime, recurrencyNumber, unit, continuous, durationNumber]
    );

    const symbolConflict = useMemo(() => {
        if (!shape || !color) return null;
        return (
            otherMedications.find(
                (other) =>
                    other.id !== medicationId &&
                    other.shape === shape &&
                    other.color === color &&
                    getMedicationStatus(other, now) !== "finished"
            ) ?? null
        );
    }, [shape, color, otherMedications, now, medicationId]);

    const errors = {
        name: !name.trim() ? "Digite o nome do remédio." : null,
        shape: !shape ? "Escolha uma forma." : null,
        color: !color ? "Escolha uma cor." : symbolConflict ? "Este símbolo já está em uso." : null,
        recurrency:
            !recurrency
                ? "Informe de quanto em quanto tempo."
                : recurrencyNumber < 1 || recurrencyNumber > LIMITS[unit]
                    ? `Use um número entre 1 e ${LIMITS[unit]}.`
                    : null,
        duration: continuous
            ? null
            : !duration
                ? "Informe por quantos dias."
                : durationNumber < 1 || durationNumber > LIMITS.duration
                    ? `Use um número entre 1 e ${LIMITS.duration}.`
                    : null,
    };

    const isValid = Object.values(errors).every((error) => error === null);
    const scheduleValid = errors.recurrency === null && errors.duration === null;
    const shown = (error: string | null) => (submitted ? error : null);

    const summary = useMemo(() => {
        if (!scheduleValid) return null;

        const dailyTimes = getDailyTimes(draft);
        const nextDose = getOccurrences(draft, now, now.clone().add(400, "days"), 1)[0] ?? null;
        const last = getLastOccurrence(draft);
        const total = countDoses(draft);

        return {
            times: dailyTimes
                ? `${describeFrequency(recurrencyNumber, unit)}: ${formatList(dailyTimes)}`
                : `${describeFrequency(recurrencyNumber, unit)}, a partir das ${startTime}`,
            next: nextDose ? `${formatDayLabel(nextDose, now)} às ${nextDose.format("HH:mm")}` : null,
            end: continuous
                ? "Uso contínuo (sem data para terminar)"
                : last
                    ? `Última dose: ${formatDayLabel(last, now).toLowerCase()} às ${last.format("HH:mm")} · ${total} ${total === 1 ? "dose" : "doses"} no total`
                    : null,
        };
    }, [scheduleValid, draft, now, recurrencyNumber, unit, startTime, continuous]);

    const applyQuickFrequency = (option: (typeof QUICK_FREQUENCIES)[number]) => {
        setRecurrency(String(option.recurrency));
        setUnit(option.unit);
    };

    const startMoment = moment(`${startDate} ${startTime}`, DATETIME_FORMAT);

    const handleSave = async () => {
        setSubmitted(true);

        if (!isValid || !shape || !color) {
            Alert.alert("Faltam algumas informações", "Confira os campos marcados em vermelho.");
            return;
        }

        const saved: Medication = {
            id: medicationId,
            name: name.trim(),
            description: description.trim(),
            shape,
            color,
            startDate,
            startTime,
            periodicity: { recurrency: recurrencyNumber, unit },
            duration: continuous ? null : durationNumber,
            takenDoses: medication?.takenDoses ?? [],
            lastUse: medication?.lastUse ?? null,
            createdAt: medication?.createdAt ?? moment().format(DATETIME_FORMAT),
        };

        try {
            setSaving(true);
            const { alarmsOk } = await saveMedication(saved);

            const close = () => {
                if (router.canGoBack()) router.back();
                else router.replace("/medications");
            };

            if (!alarmsOk) {
                Alert.alert(
                    "Remédio salvo",
                    "Mas não foi possível agendar o alarme agora. Abra a aba Ajustes e confira as permissões do alarme.",
                    [{ text: "Entendi", onPress: close }]
                );
                return;
            }

            close();
        } catch (error) {
            console.error("[MedicationForm] erro ao salvar", error);
            Alert.alert("Não foi possível salvar", "Tente novamente em alguns segundos.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen
            showBack
            title={isEditing ? "Editar remédio" : "Novo remédio"}
            subtitle={isEditing ? undefined : "Preencha as informações e escolha o símbolo da caixa."}
            footer={
                <Button
                    title={isEditing ? "Salvar alterações" : "Salvar remédio"}
                    icon="content-save"
                    variant="success"
                    size="lg"
                    loading={saving}
                    onPress={handleSave}
                />
            }
        >
            <Card style={styles.section}>
                <SectionTitle title="Remédio" />
                <TextField
                    label="Nome do remédio"
                    placeholder="Ex.: Losartana 50 mg"
                    value={name}
                    onChangeText={setName}
                    maxLength={LIMITS.name}
                    error={shown(errors.name)}
                />
                <TextField
                    label="Como tomar"
                    optional
                    placeholder="Ex.: 1 comprimido com água"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={LIMITS.description}
                />
            </Card>

            <Card style={styles.section}>
                <SectionTitle title="Símbolo da caixa" />

                <View style={styles.preview}>
                    <MedicationSymbol shape={shape ?? "circle"} color={color} size={56} tile neutral={!shape || !color} />
                    <View style={styles.previewText}>
                        {shape && color ? (
                            <>
                                <AppText variant="body" color={colors.textMuted}>
                                    Desenhe na caixa do remédio:
                                </AppText>
                                <AppText variant="heading">{describeSymbol(shape, color)}</AppText>
                            </>
                        ) : (
                            <AppText variant="body" color={colors.textMuted}>
                                Escolha uma forma e uma cor. Esse mesmo símbolo aparece no alarme e deve ser desenhado na caixa.
                            </AppText>
                        )}
                    </View>
                </View>

                {symbolConflict ? (
                    <Banner
                        tone="danger"
                        title="Símbolo repetido"
                        message={`"${symbolConflict.name}" já usa ${describeSymbolWithArticle(shape, color)}. Escolha outra forma ou cor para não confundir.`}
                    />
                ) : null}

                <View style={styles.fieldGroup}>
                    <FieldLabel>Forma</FieldLabel>
                    <ShapePicker value={shape} color={color} onChange={setShape} />
                    {shown(errors.shape) ? (
                        <AppText variant="caption" color={colors.danger} bold>
                            {errors.shape}
                        </AppText>
                    ) : null}
                </View>

                <View style={styles.fieldGroup}>
                    <FieldLabel>Cor</FieldLabel>
                    <ColorPicker value={color} onChange={setColor} />
                    {shown(errors.color) && !symbolConflict ? (
                        <AppText variant="caption" color={colors.danger} bold>
                            {errors.color}
                        </AppText>
                    ) : null}
                </View>
            </Card>

            <Card style={styles.section}>
                <SectionTitle title="Horários" />

                <View style={styles.fieldGroup}>
                    <FieldLabel>Tomar a cada</FieldLabel>
                    <View style={styles.chips}>
                        {QUICK_FREQUENCIES.map((option) => (
                            <ChoiceChip
                                key={option.label}
                                label={option.label}
                                selected={recurrencyNumber === option.recurrency && unit === option.unit}
                                onPress={() => applyQuickFrequency(option)}
                            />
                        ))}
                    </View>
                    <View style={styles.row}>
                        <TextField
                            label="Quantidade"
                            placeholder="8"
                            keyboardType="number-pad"
                            maxLength={2}
                            value={recurrency}
                            onChangeText={(text) => setRecurrency(onlyDigits(text))}
                            style={styles.amountField}
                        />
                        <View style={styles.unitField}>
                            <FieldLabel>Unidade</FieldLabel>
                            <SegmentedControl
                                accessibilityLabel="Unidade do intervalo"
                                value={unit}
                                onChange={setUnit}
                                options={[
                                    { value: "hours", label: "Horas" },
                                    { value: "days", label: "Dias" },
                                ]}
                            />
                        </View>
                    </View>
                    {shown(errors.recurrency) ? (
                        <AppText variant="caption" color={colors.danger} bold>
                            {errors.recurrency}
                        </AppText>
                    ) : null}
                </View>

                <View style={styles.row}>
                    <DateTimeField
                        label="Primeira dose (dia)"
                        mode="date"
                        value={startMoment.toDate()}
                        displayValue={formatDayLabel(startMoment, now)}
                        onChange={(date) => setStartDate(moment(date).format(DATE_FORMAT))}
                    />
                    <DateTimeField
                        label="Horário"
                        mode="time"
                        value={startMoment.toDate()}
                        displayValue={startTime}
                        onChange={(date) => setStartTime(moment(date).format("HH:mm"))}
                    />
                </View>
            </Card>

            <Card style={styles.section}>
                <SectionTitle title="Duração do tratamento" />
                <SegmentedControl
                    accessibilityLabel="Tipo de duração"
                    value={continuous ? "continuous" : "days"}
                    onChange={(value) => setContinuous(value === "continuous")}
                    options={[
                        { value: "days", label: "Por alguns dias" },
                        { value: "continuous", label: "Uso contínuo" },
                    ]}
                />
                {continuous ? (
                    <AppText variant="body" color={colors.textMuted}>
                        O alarme continua tocando todos os dias até o remédio ser excluído.
                    </AppText>
                ) : (
                    <TextField
                        label="Por quantos dias?"
                        placeholder="Ex.: 7"
                        keyboardType="number-pad"
                        maxLength={3}
                        value={duration}
                        onChangeText={(text) => setDuration(onlyDigits(text))}
                        suffix="dias"
                        error={shown(errors.duration)}
                    />
                )}
            </Card>

            {summary ? (
                <Card style={[styles.section, styles.summary]}>
                    <SectionTitle title="Resumo" />
                    <SummaryLine label="Horários" value={summary.times} />
                    {summary.next ? <SummaryLine label="Próximo alarme" value={summary.next} /> : null}
                    {summary.end ? <SummaryLine label="Término" value={summary.end} /> : null}
                </Card>
            ) : null}
        </Screen>
    );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.summaryLine}>
            <AppText variant="label" color={colors.primary}>
                {label}
            </AppText>
            <AppText variant="bodyLarge">{value}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: spacing.lg,
    },
    preview: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
    },
    previewText: {
        flex: 1,
        gap: 2,
    },
    fieldGroup: {
        gap: spacing.sm,
    },
    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    row: {
        flexDirection: "row",
        gap: spacing.md,
        alignItems: "flex-start",
    },
    amountField: {
        width: 120,
    },
    unitField: {
        flex: 1,
        gap: 6,
    },
    summary: {
        backgroundColor: colors.primarySoft,
        borderColor: "#C9D8EE",
    },
    summaryLine: {
        gap: 2,
    },
});
