import { FontAwesome } from "@expo/vector-icons";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { style } from "./ButtonStyles";

type ButtonProps = {
    title: string;
    onPress: () => void;
    type: "primary" | "secondary" | "success" | "danger";
    icon?: React.ComponentProps<typeof FontAwesome>["name"];
    disabled?: boolean;
    loading?: boolean;
};

export default function Button(
    { title, onPress, type, icon, disabled, loading }: ButtonProps
) {
    const isDisabled = !!(disabled || loading);

    return (
        <View style={[
            style.container,
            style[`${type}Button` as keyof typeof style] as ViewStyle,
            isDisabled ? style.buttonDisabled : null,
        ]}>
            {loading ?
                <FontAwesome name="spinner" style={style.loadingIcon} />
                : <TouchableOpacity
                    onPress={onPress}
                    style={style.textIcon}
                    disabled={isDisabled}
                >
                    {icon && <FontAwesome name={icon} style={style.icon} />}

                    <Text style={style.buttonText}>{title}</Text>
                </TouchableOpacity>
            }
        </View>
    )
}