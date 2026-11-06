import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { describeSymbol, getColor, getShape } from "@/constants/medication";

type MedicationSymbolProps = {
    shape: string | null | undefined;
    color: string | null | undefined;
    /** Tamanho da forma em pontos. */
    size?: number;
    /** Mostra a forma sobre um fundo suave da mesma cor. */
    tile?: boolean;
    /** Cor neutra (usada no seletor antes de escolher a cor). */
    neutral?: boolean;
};

/**
 * Desenha a forma geométrica na cor do remédio — o mesmo símbolo que o enfermeiro
 * desenha na caixa. O contorno escuro garante contraste mesmo em cores claras (amarelo).
 */
export default function MedicationSymbol({ shape, color, size = 48, tile = false, neutral = false }: MedicationSymbolProps) {
    const shapeOption = getShape(shape);
    const colorOption = getColor(color);
    const fill = neutral ? "#9AA3AE" : colorOption.hex;
    const outline = neutral ? "#5F6874" : colorOption.dark;

    const symbol = (
        <View style={{ width: size, height: size }}>
            <MaterialCommunityIcons name={shapeOption.icon} size={size} color={fill} style={styles.layer} />
            <MaterialCommunityIcons name={shapeOption.outline} size={size} color={outline} style={styles.layer} />
        </View>
    );

    const label = neutral ? shapeOption.label : describeSymbol(shape, color);

    if (!tile) {
        return (
            <View accessible accessibilityRole="image" accessibilityLabel={label}>
                {symbol}
            </View>
        );
    }

    const tileSize = Math.round(size * 1.55);

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={label}
            style={[
                styles.tile,
                {
                    width: tileSize,
                    height: tileSize,
                    borderRadius: Math.round(tileSize * 0.28),
                    backgroundColor: neutral ? "#EEF0F2" : colorOption.soft,
                },
            ]}
        >
            {symbol}
        </View>
    );
}

const styles = StyleSheet.create({
    layer: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    tile: {
        alignItems: "center",
        justifyContent: "center",
    },
});
