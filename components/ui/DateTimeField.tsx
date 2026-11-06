import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing, TOUCH_MIN } from "@/constants/theme";
import AppText from "./AppText";
import Button from "./Button";

type DateTimeFieldProps = {
    label: string;
    mode: "date" | "time";
    value: Date;
    /** Texto exibido no campo (ex.: "Hoje, 06/11" ou "08:00"). */
    displayValue: string;
    onChange: (date: Date) => void;
    minimumDate?: Date;
    error?: string | null;
};

/** Campo que abre o seletor nativo de data/hora (relógio do Android ou roleta do iOS). */
export default function DateTimeField({
    label,
    mode,
    value,
    displayValue,
    onChange,
    minimumDate,
    error,
}: DateTimeFieldProps) {
    const [iosOpen, setIosOpen] = useState(false);
    const [iosValue, setIosValue] = useState(value);

    const open = () => {
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value,
                mode,
                is24Hour: true,
                minimumDate,
                onChange: (event: DateTimePickerEvent, date?: Date) => {
                    if (event.type === "set" && date) onChange(date);
                },
            });
            return;
        }

        setIosValue(value);
        setIosOpen(true);
    };

    return (
        <View style={styles.container}>
            <AppText variant="label" color={colors.textMuted}>
                {label}
            </AppText>

            <Pressable
                onPress={open}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${displayValue}. Toque para alterar.`}
                style={({ pressed }) => [styles.field, error ? styles.fieldError : null, pressed && styles.fieldPressed]}
            >
                <MaterialCommunityIcons
                    name={mode === "time" ? "clock-outline" : "calendar-month-outline"}
                    size={24}
                    color={colors.primary}
                />
                <AppText variant="bodyLarge" bold style={styles.value} numberOfLines={1}>
                    {displayValue}
                </AppText>
                <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textMuted} />
            </Pressable>

            {error ? (
                <AppText variant="caption" color={colors.danger} bold>
                    {error}
                </AppText>
            ) : null}

            {Platform.OS === "ios" ? (
                <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
                    <View style={styles.overlay}>
                        <View style={styles.sheet}>
                            <AppText variant="heading" align="center">
                                {label}
                            </AppText>
                            <DateTimePicker
                                value={iosValue}
                                mode={mode}
                                display="spinner"
                                locale="pt-BR"
                                minimumDate={minimumDate}
                                onChange={(_, date) => date && setIosValue(date)}
                            />
                            <Button
                                title="Confirmar"
                                icon="check"
                                size="lg"
                                onPress={() => {
                                    onChange(iosValue);
                                    setIosOpen(false);
                                }}
                            />
                            <Button title="Cancelar" variant="ghost" onPress={() => setIosOpen(false)} />
                        </View>
                    </View>
                </Modal>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 6,
    },
    field: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: TOUCH_MIN,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surface,
    },
    fieldPressed: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary,
    },
    fieldError: {
        borderColor: colors.danger,
        backgroundColor: colors.dangerSoft,
    },
    value: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: colors.overlay,
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        padding: spacing.xl,
        paddingBottom: spacing.xxl + 8,
        gap: spacing.md,
    },
});
