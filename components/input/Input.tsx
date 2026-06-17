import { KeyboardTypeOptions, Text, TextInput, View } from "react-native";
import { styles } from "./InputStyle";


type InputProps = {
    label?: string;
    placeholder?: string;
    type?: KeyboardTypeOptions;
    value?: string;
    onChangeText?: (text: string) => void;
    onBlur?: () => void;
    maxLength?: number;
    errorMessage?: string;
    customStylesContainer?: object;
};

export default function Input({
    label,
    placeholder,
    type = "default",
    value,
    onChangeText,
    onBlur,
    maxLength,
    errorMessage,
    customStylesContainer = {},
}: InputProps) {
    return (
        <View style={[styles.container, customStylesContainer]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TextInput
                keyboardType={type}
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
                maxLength={maxLength}
                placeholder={placeholder}
                placeholderTextColor={errorMessage ? "#B42318" : "#9A9595"}
                style={[styles.input, errorMessage && styles.inputError]}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
    )
}