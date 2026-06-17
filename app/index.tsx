import Button from "@/components/button/Button";
import { getNextMedication, markMedicationAsTaken, syncMedicationNotifications } from "@/utils/MedicationNotifications";
import renderShape from "@/utils/RenderShape";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { styles } from "./indexStyle";

export default function Index() {
  const [nextMedication, setNextMedication] = useState<any | null>(null);

  const fetchNextMedication = async () => {
    const storedMedicationsStr = await AsyncStorage.getItem("medications");
    const storedMedications: any[] = storedMedicationsStr ? JSON.parse(storedMedicationsStr) : [];

    const nextMedicationItem = getNextMedication(storedMedications);

    setNextMedication(nextMedicationItem);
  };

  useEffect(() => {
    fetchNextMedication();
  }, []);

  const setLastUse = async () => {
    const storedMedicationsStr = await AsyncStorage.getItem("medications");
    const storedMedications: any[] = storedMedicationsStr ? JSON.parse(storedMedicationsStr) : [];

    if (!nextMedication?.medication?.id) {
      return;
    }

    const medicationsWithLastUse = markMedicationAsTaken(storedMedications, nextMedication.medication.id);
    const scheduledMedications = await syncMedicationNotifications(medicationsWithLastUse);

    await AsyncStorage.setItem("medications", JSON.stringify(scheduledMedications));
    alert("Medicação marcada como tomada!");
    setNextMedication(getNextMedication(scheduledMedications));
  };

  return (
    <ScrollView
      style={{ flex: 1, marginTop: 120, marginBottom: 80 }}
      contentContainerStyle={{ paddingVertical: 16 }}
    >
      <View style={styles.container}>
        <Text style={styles.nextMedicationTitle}>Próxima medicação</Text>

        <View style={styles.nextMedicationContainer}>
          {nextMedication ? (
            <>
              <View style={[styles.shapeAndColor, { backgroundColor: nextMedication.medication?.color || "#2563EB" }]}>
                {renderShape(nextMedication.medication?.shape, 60, "#fff")}
              </View>

              <Text style={styles.medicationTime}>{nextMedication.occurrence.format("HH:mm")}</Text>

              <Text style={[styles.medicationName, { color: nextMedication.medication?.color || "red" }]}>
                {nextMedication.medication?.name}
              </Text>

              <Text style={styles.medicationDose}>{nextMedication.medication?.description}</Text>
            </>
          ) : (
            <Text style={styles.medicationDose}>Nenhuma medicação agendada.</Text>
          )}
        </View>

        <Button
          title="JÁ TOMEI"
          onPress={() => { setLastUse(); }}
          type="success"
          icon="check"
        />
      </View>
    </ScrollView>
  );
}
