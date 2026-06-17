import CardMedication from "@/components/cardMedication/CardMedication";
import { syncMedicationNotifications } from "@/utils/MedicationNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { styles } from "./listMedicationsStyles";

export default function ListMedications() {
    const [medications, setMedications] = useState<any[]>([]);

    useEffect(() => {
        const fetchMedications = async () => {
            const storedMedications = await AsyncStorage.getItem("medications");
            if (storedMedications) {
                setMedications(JSON.parse(storedMedications));
            }
        };

        fetchMedications();
    }, []);

    const onDeleteMedication = async (id: string) => {
        const updatedMedications = medications?.filter(med => med?.id !== id);

        try {
            const scheduledMedications = await syncMedicationNotifications(updatedMedications);
            await AsyncStorage.setItem('medications', JSON.stringify(scheduledMedications));
            setMedications(scheduledMedications);
        } catch (error) {
            console.error('Erro ao excluir a medicação:', error);
            alert('Houve um erro ao excluir a medicação. Tente novamente.');
            return;
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, marginTop: 120, marginBottom: 80 }}
            contentContainerStyle={{ paddingVertical: 16 }}
        >
            <Text style={styles.medicationsTitle}> Meus Medicamentos </Text>

            <View style={styles.medicationsContainer}>
                {medications?.map((medication) => (
                    <CardMedication
                        key={medication?.id}
                        medication={medication}
                        onDelete={onDeleteMedication}
                    />
                ))}

                {medications.length === 0 && (
                    <Text style={styles.noMedicationsText}>Nenhum medicamento cadastrado.</Text>
                )}
            </View>
        </ScrollView >
    )
}