import { useLocalSearchParams, useRouter } from "expo-router";
import MedicationForm from "@/components/medication/MedicationForm";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Screen from "@/components/ui/Screen";
import { useAppData } from "@/hooks/useAppData";

export default function EditMedicationScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { medications, loading } = useAppData();

    if (loading) return null;

    const medication = medications.find((item) => item.id === id);

    if (!medication) {
        return (
            <Screen showBack>
                <EmptyState
                    icon="pill-off"
                    title="Remédio não encontrado"
                    message="Ele pode ter sido excluído."
                    action={<Button title="Ver remédios" onPress={() => router.replace("/medications")} />}
                />
            </Screen>
        );
    }

    return (
        <MedicationForm
            key={medication.id}
            medication={medication}
            otherMedications={medications.filter((item) => item.id !== medication.id)}
        />
    );
}
