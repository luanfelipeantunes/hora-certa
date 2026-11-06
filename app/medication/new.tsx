import MedicationForm from "@/components/medication/MedicationForm";
import { useAppData } from "@/hooks/useAppData";

export default function NewMedicationScreen() {
    const { medications, loading } = useAppData();

    if (loading) return null;

    return <MedicationForm otherMedications={medications} />;
}
