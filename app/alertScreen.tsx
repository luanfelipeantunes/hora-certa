import Button from "@/components/button/Button";
import { markMedicationAsTaken, syncMedicationNotifications } from "@/utils/MedicationNotifications";
import renderShape from "@/utils/RenderShape";
import notifee from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { ScrollView, Text, Vibration, View } from "react-native";
import { styles } from "./alertScreenStyle";

// --- INÍCIO DO MOCK DO NOTIFEE ---
// let notifee: any;
// notifee = { cancelAllNotifications: async () => { } };
// --- FIM DO MOCK DO NOTIFEE ---

export default function AlertScreen() {
    const router = useRouter();
    const { medicationId } = useLocalSearchParams<{ medicationId?: string | string[] }>();
    const [medication, setMedication] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadMedication = async () => {
            const storedMedicationsStr = await AsyncStorage.getItem("medications");
            const storedMedications: any[] = storedMedicationsStr ? JSON.parse(storedMedicationsStr) : [];
            const targetMedicationId = Array.isArray(medicationId) ? medicationId[0] : medicationId;

            const selectedMedication = storedMedications.find((med) => med.id === targetMedicationId) || null;

            setMedication(selectedMedication);
        };

        loadMedication();
    }, [medicationId]);

    const setLastUse = async () => {
        try {
            setLoading(true);

            Vibration.vibrate(500);

            //Interrompe o despertador IMEDIATAMENTE ao clicar
            await notifee.cancelAllNotifications();

            const storedMedicationsStr = await AsyncStorage.getItem("medications");
            const storedMedications: any[] = storedMedicationsStr ? JSON.parse(storedMedicationsStr) : [];
            const targetMedicationId = Array.isArray(medicationId) ? medicationId[0] : medicationId;

            if (!targetMedicationId) {
                setLoading(false);
                return;
            }

            const medicationsWithLastUse = markMedicationAsTaken(storedMedications, targetMedicationId);
            const scheduledMedications = await syncMedicationNotifications(medicationsWithLastUse);

            await AsyncStorage.setItem("medications", JSON.stringify(scheduledMedications));
            alert("Medicação marcada como tomada!");
            router.replace("/");
        } catch (error) {
            console.error("Error occurred while marking medication as taken:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={{ flex: 1, marginTop: 100, marginBottom: 80 }}
            contentContainerStyle={{ paddingVertical: 16 }}
        >
            <View style={styles.container}>
                <View style={styles.titleHourContainer}>
                    <Text style={styles.titleHour}>Agora</Text>

                    <Text style={styles.hour}>{moment().format("HH:mm")}</Text>
                </View>

                {medication ? (
                    <View style={styles.nextMedicationContainer}>
                        <View style={[
                            styles.shapeAndColor,
                            { backgroundColor: medication?.color || "#2563EB" }
                        ]} >
                            {renderShape(medication?.shape, 60, "#fff")}
                        </View>

                        <Text style={styles.medicationTitle}>{medication?.name}</Text>

                        <Text
                            style={[
                                styles.medicationDescription,
                                { backgroundColor: medication?.color || "#2563EB" }
                            ]}
                        >
                            {medication?.description}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.nextMedicationContainer}>
                        <Text style={styles.medicationTitle}>Medicação não encontrada.</Text>
                    </View>
                )}

                <Button
                    title="JÁ TOMEI"
                    onPress={() => setLastUse()}
                    type="success"
                    icon="check"
                    loading={loading}
                />
            </View>
        </ScrollView>
    )
}