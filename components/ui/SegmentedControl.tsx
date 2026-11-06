import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, TOUCH_MIN } from "@/constants/theme";
import AppText from "./AppText";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
    options: Option<T>[];
    value: T | null;
    onChange: (value: T) => void;
    accessibilityLabel?: string;
};

export default function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    accessibilityLabel,
}: SegmentedControlProps<T>) {
    return (
        <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.label}
                        style={({ pressed }) => [
                            styles.option,
                            selected && styles.optionSelected,
                            pressed && !selected && styles.optionPressed,
                        ]}
                    >
                        <AppText variant="body" bold color={selected ? colors.white : colors.textMuted}>
                            {option.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        padding: 4,
        gap: 4,
    },
    option: {
        flex: 1,
        minHeight: TOUCH_MIN - 8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.sm,
        paddingHorizontal: 8,
    },
    optionSelected: {
        backgroundColor: colors.primary,
    },
    optionPressed: {
        backgroundColor: colors.border,
    },
});
