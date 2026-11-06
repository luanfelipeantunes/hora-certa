import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, StyleSheet, View } from "react-native";
import MedicationCard from "@/components/medication/MedicationCard";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Screen from "@/components/ui/Screen";
import SectionTitle from "@/components/ui/SectionTitle";
import { spacing } from "@/constants/theme";
import { useAppData } from "@/hooks/useAppData";
import { useNow } from "@/hooks/useNow";
import type { Medication } from "@/types/medication";
import { deleteMedication } from "@/utils/medicationActions";
import { getMedicationStatus } from "@/utils/schedule";

export default function MedicationsScreen() {
    const router = useRouter();
    const now = useNow();
    const { medications, loading } = useAppData();

    const { current, finished } = useMemo(() => {
        const sorted = [...medications].sort((a, b) => a.name.localeCompare(b.name));
        return {
            current: sorted.filter((medication) => getMedicationStatus(medication, now) !== "finished"),
            finished: sorted.filter((medication) => getMedicationStatus(medication, now) === "finished"),
        };
    }, [medications, now]);

    const confirmDelete = (medication: Medication) => {
        Alert.alert(
            `Excluir "${medication.name}"?`,
            "Os alarmes deste remédio serão cancelados. Esta ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteMedication(medication.id);
                        } catch (error) {
                            console.error("[Medications] erro ao excluir", error);
                            Alert.alert("Não foi possível excluir", "Tente novamente.");
                        }
                    },
                },
            ]
        );
    };

    const renderList = (items: Medication[]) => (
        <View style={styles.list}>
            {items.map((medication) => (
                <MedicationCard
                    key={medication.id}
                    medication={medication}
                    now={now}
                    onEdit={() => router.push({ pathname: "/medication/[id]", params: { id: medication.id } })}
                    onDelete={() => confirmDelete(medication)}
                />
            ))}
        </View>
    );

    const subtitle =
        current.length === 0
            ? "Nenhum remédio em uso"
            : current.length === 1
                ? "1 remédio em uso"
                : `${current.length} remédios em uso`;

    return (
        <Screen title="Remédios" subtitle={loading ? undefined : subtitle}>
            <Button title="Novo remédio" icon="plus" size="lg" onPress={() => router.push("/medication/new")} />

            {loading ? null : medications.length === 0 ? (
                <EmptyState
                    icon="pill"
                    title="Nenhum remédio cadastrado"
                    message="Toque em “Novo remédio” para cadastrar o primeiro."
                />
            ) : (
                <>
                    {current.length > 0 ? (
                        <>
                            <SectionTitle title="Em uso" />
                            {renderList(current)}
                        </>
                    ) : null}

                    {finished.length > 0 ? (
                        <>
                            <SectionTitle title="Tratamentos encerrados" />
                            {renderList(finished)}
                        </>
                    ) : null}
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: spacing.lg,
    },
});
