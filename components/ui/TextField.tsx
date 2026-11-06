import { useState } from "react";
import {
    StyleSheet,
    TextInput,
    View,
    type KeyboardTypeOptions,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { colors, fonts, radius, TOUCH_MIN } from "@/constants/theme";
import AppText from "./AppText";

type TextFieldProps = {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    hint?: string;
    error?: string | null;
    keyboardType?: KeyboardTypeOptions;
    maxLength?: number;
    optional?: boolean;
    style?: StyleProp<ViewStyle>;
    suffix?: string;
};

export default function TextField({
    label,
    value,
    onChangeText,
    placeholder,
    hint,
    error,
    keyboardType = "default",
    maxLength,
    optional,
    style,
    suffix,
}: TextFieldProps) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.container, style]}>
            <AppText variant="label" color={colors.textMuted}>
                {label}
                {optional ? <AppText variant="label" bold={false} color={colors.textSubtle}> (opcional)</AppText> : null}
            </AppText>

            <View
                style={[
                    styles.inputWrapper,
                    focused && styles.inputFocused,
                    error ? styles.inputError : null,
                ]}
            >
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSubtle}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    accessibilityLabel={label}
                    maxFontSizeMultiplier={1.3}
                    style={styles.input}
                />
                {suffix ? (
                    <AppText variant="body" color={colors.textMuted} style={styles.suffix}>
                        {suffix}
                    </AppText>
                ) : null}
            </View>

            {error ? (
                <AppText variant="caption" color={colors.danger} bold>
                    {error}
                </AppText>
            ) : hint ? (
                <AppText variant="caption">{hint}</AppText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: TOUCH_MIN,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        borderRadius: radius.md,
        paddingHorizontal: 14,
    },
    inputFocused: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    inputError: {
        borderColor: colors.danger,
        backgroundColor: colors.dangerSoft,
    },
    input: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 19,
        color: colors.text,
        paddingVertical: 12,
    },
    suffix: {
        marginLeft: 8,
    },
});
