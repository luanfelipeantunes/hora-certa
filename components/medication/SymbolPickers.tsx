import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import AppText from "@/components/ui/AppText";
import { COLORS, SHAPES } from "@/constants/medication";
import { colors, radius, spacing } from "@/constants/theme";
import type { ColorId, ShapeId } from "@/types/medication";
import MedicationSymbol from "./MedicationSymbol";

type ShapePickerProps = {
    value: ShapeId | null;
    color: ColorId | null;
    onChange: (shape: ShapeId) => void;
};

export function ShapePicker({ value, color, onChange }: ShapePickerProps) {
    return (
        <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Forma geométrica">
            {SHAPES.map((shape) => {
                const selected = shape.id === value;
                return (
                    <Pressable
                        key={shape.id}
                        onPress={() => onChange(shape.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={shape.label}
                        style={({ pressed }) => [
                            styles.shapeOption,
                            selected && styles.optionSelected,
                            pressed && !selected && styles.optionPressed,
                        ]}
                    >
                        <MedicationSymbol shape={shape.id} color={color} size={40} neutral={!color} />
                        <AppText variant="label" bold={selected} color={selected ? colors.primary : colors.textMuted}>
                            {shape.label}
                        </AppText>
                        {selected ? <SelectedBadge /> : null}
                    </Pressable>
                );
            })}
        </View>
    );
}

type ColorPickerProps = {
    value: ColorId | null;
    onChange: (color: ColorId) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    return (
        <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Cor">
            {COLORS.map((color) => {
                const selected = color.id === value;
                return (
                    <Pressable
                        key={color.id}
                        onPress={() => onChange(color.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={color.label}
                        style={({ pressed }) => [
                            styles.colorOption,
                            selected && styles.optionSelected,
                            pressed && !selected && styles.optionPressed,
                        ]}
                    >
                        <View style={[styles.swatch, { backgroundColor: color.hex, borderColor: color.dark }]}>
                            {selected ? (
                                <MaterialCommunityIcons
                                    name="check-bold"
                                    size={26}
                                    color={color.id === "yellow" ? color.dark : colors.white}
                                />
                            ) : null}
                        </View>
                        <AppText variant="label" bold={selected} color={selected ? colors.primary : colors.textMuted}>
                            {color.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

function SelectedBadge() {
    return (
        <View style={styles.badge}>
            <MaterialCommunityIcons name="check-bold" size={14} color={colors.white} />
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    shapeOption: {
        width: "31.5%",
        flexGrow: 1,
        alignItems: "center",
        gap: 6,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    colorOption: {
        width: "23%",
        flexGrow: 1,
        alignItems: "center",
        gap: 6,
        paddingVertical: spacing.sm + 2,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: "transparent",
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    optionPressed: {
        backgroundColor: colors.surfaceMuted,
    },
    swatch: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    badge: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
});
