import { colors } from "@/utils/Colors";
import renderShape from "@/utils/RenderShape";
import { Text, View } from "react-native";
import Button from "../button/Button";
import { styles } from "./CardMedicationStyles";

export default function CardMedication({ medication, onDelete }: { medication: any; onDelete: (id: string) => void }) {
    const formattedDescription = () => {
        const { periodicity, description, duration } = medication || {};
        const { recurrency, unit } = periodicity;
        const unitText = unit === "hours" ? "hora(s)" : unit === "days" ? "dia(s)" : unit;

        return `${description} cada ${recurrency} ${unitText} durante ${duration} dias.`;
    }

    const getHexColor = (colorName: string) => {
        let hex = '';
        const color = colors.find(c => c.id === colorName);
        if (color) hex = color?.hex;

        return hex;
    }

    return (
        <View style={styles.container}>
            <View style={styles.rowContent}>
                <View style={[
                    styles.shapeAndColor,
                    { backgroundColor: getHexColor(medication?.color) || "#2563EB" }
                ]}>
                    {renderShape(medication?.shape)}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.medicationName}>{medication?.name}</Text>
                    <Text style={styles.medicationDescription}>{formattedDescription()}</Text>
                </View>
            </View>

            <Button
                type="danger"
                title="Excluir"
                onPress={() => onDelete(medication?.id)}
                icon="trash"
            />
        </View>
    )
}