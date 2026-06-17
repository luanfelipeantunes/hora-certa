import Button from "@/components/button/Button";
import Input from "@/components/input/Input";
import { colors } from "@/utils/Colors";
import { syncMedicationNotifications } from "@/utils/MedicationNotifications";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';
import renderShape from "../utils/RenderShape";
import { styles } from "./newMedicationStyle";

export default function NewMedication() {
    const router = useRouter();

    const [allMeds, setAllMeds] = useState([]);
    const [medName, setMedName] = useState("");
    const [medDescription, setMedDescription] = useState("");
    const [openPeriodicity, setOpenPeriodicity] = useState(false);
    const [periodicityItems, setPeriodicityItems] = useState([
        { label: 'Dias', value: 'days' },
        { label: 'Horas', value: 'hours' },
    ]);
    const [medPeriodicityUnit, setMedPeriodicityUnit] = useState(null);
    const [medPeriodicityRecurrence, setMedPeriodicityRecurrence] = useState("");
    const [selectedShape, setSelectedShape] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedStartTime, setSelectedStartTime] = useState("");
    const [startTimeError, setStartTimeError] = useState("");
    const [duration, setDuration] = useState("");

    const shapes = [
        { id: 'circle', label: 'Círculo' },
        { id: 'square', label: 'Quadrado' },
        { id: 'triangle', label: 'Triângulo' },
    ];

    useEffect(() => {
        const fetchMeds = async () => {
            try {
                const storedMeds = await AsyncStorage.getItem('medications');
                if (storedMeds) {
                    setAllMeds(JSON.parse(storedMeds));
                }
            } catch (error) {
                console.error('Erro ao carregar as medicações:', error);
            }
        }

        fetchMeds();
    }, [])

    const formatStartTime = (time: string) => {
        const digits = time.replace(/\D/g, "").slice(0, 4);

        if (!digits) return "";

        if (digits.length <= 2) return digits;

        return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    };

    const validateStartTime = (time: string) => {
        if (!time) return "";

        const [hoursPart, minutesPart = ""] = time.split(":");
        const hours = Number(hoursPart);
        const minutes = Number(minutesPart);

        if (hoursPart.length === 2 && hours > 23) {
            return "Use uma hora entre 00 e 23";
        }

        if (minutesPart.length === 2 && minutes > 59) {
            return "Use minutos entre 00 e 59.";
        }

        return "";
    };

    const handleChangeStartTime = (time: string) => {
        const formattedTime = formatStartTime(time);

        setSelectedStartTime(formattedTime);
        setStartTimeError(validateStartTime(formattedTime));
    };

    const handleBlurStartTime = () => {
        if (!selectedStartTime) {
            setStartTimeError("");
            return;
        }

        if (selectedStartTime.length === 1) {
            setSelectedStartTime(`0${selectedStartTime}`);
            setStartTimeError("");
            return;
        }

        if (selectedStartTime.length === 2) {
            const hours = Number(selectedStartTime);

            if (hours > 23) {
                setStartTimeError("Use uma hora entre 00 e 23.");
                return;
            }

            setSelectedStartTime(`${selectedStartTime}:00`);
            setStartTimeError("");
            return;
        }

        const [hoursPart, minutesPart = ""] = selectedStartTime.split(":");

        if (hoursPart.length === 2 && Number(hoursPart) > 23) {
            setStartTimeError("Use uma hora entre 00 e 23.");
            return;
        }

        if (minutesPart.length === 2 && Number(minutesPart) > 59) {
            setStartTimeError("Use minutos entre 00 e 59.");
            return;
        }

        setStartTimeError("");
    }

    const formValidate = () => {
        if (!medName?.trim()) return false;
        if (!medPeriodicityRecurrence?.trim() || !medPeriodicityUnit) return false;
        if (!selectedStartTime?.trim()) return false;
        if (startTimeError) return false;
        if (!selectedShape) return false;
        if (!selectedColor) return false;
        if (!duration?.trim()) return false;

        return true;
    }

    const handleSaveMedication = async () => {
        if (!formValidate()) return;

        const getStartDate = () => {
            const startTime = moment(selectedStartTime, "HH:mm").format("HH:mm");
            const nowTime = moment().format("HH:mm");

            if (moment(startTime, "HH:mm").isBefore(moment(nowTime, "HH:mm"))) {
                return moment().add(1, "day").format("YYYY-MM-DD");
            }

            return moment().format("YYYY-MM-DD");
        }

        const newMedication = {
            id: Date.now().toString(),
            name: medName.trim(),
            description: medDescription.trim(),
            periodicity: {
                recurrency: Number(medPeriodicityRecurrence),
                unit: medPeriodicityUnit,
            },
            startTime: selectedStartTime,
            startDate: getStartDate(),
            lastUse: null,
            shape: selectedShape,
            color: selectedColor,
            duration: Number(duration),
        };

        const updatedMeds = [...allMeds, newMedication];

        try {
            const scheduledMedications = await syncMedicationNotifications(updatedMeds);

            await AsyncStorage.setItem('medications', JSON.stringify(scheduledMedications));
            router.push("/listMedications");
        } catch (error) {
            console.error('Erro ao salvar a medicação:', error);
            alert('Houve um erro ao salvar a medicação. Tente novamente.');
            return;
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, marginTop: 120, marginBottom: 120 }}
            contentContainerStyle={{ paddingVertical: 16 }}
        >
            <Text style={styles.title}>Nova Medicação</Text>
            <Text style={styles.description}>Configure as medicações do paciente e as informações visuais</Text>

            <View>
                <Input
                    label="Nome do Medicamento"
                    placeholder="ex: Paracetamol 500mg"
                    value={medName}
                    onChangeText={setMedName}
                />

                <Input
                    label="Descrição do Medicamento"
                    placeholder="ex: Tomar 1 comprimido"
                    value={medDescription}
                    onChangeText={setMedDescription}
                />

                <View style={styles.periodicityContainer}>
                    <Input
                        label="A cada"
                        placeholder="ex: 8"
                        type="numeric"
                        value={medPeriodicityRecurrence}
                        onChangeText={setMedPeriodicityRecurrence}
                        customStylesContainer={{ width: "35%" }}
                    />

                    <DropDownPicker
                        open={openPeriodicity}
                        setOpen={setOpenPeriodicity}
                        items={periodicityItems}
                        value={medPeriodicityUnit}
                        placeholder="Selecione a periodicidade"
                        listMode="SCROLLVIEW"
                        containerStyle={styles.dropDownContainer}
                        style={styles.dropDown}
                        dropDownContainerStyle={styles.dropDownStyle}
                        setValue={setMedPeriodicityUnit}
                        setItems={setPeriodicityItems}
                    />
                </View>

                <View style={styles.periodicityContainer}>
                    <Input
                        label="Iniciando às:"
                        placeholder="ex: 08:00"
                        type="numeric"
                        maxLength={5}
                        value={selectedStartTime}
                        onChangeText={handleChangeStartTime}
                        onBlur={handleBlurStartTime}
                        errorMessage={startTimeError}
                        customStylesContainer={{ width: "49%" }}
                    />

                    <Input
                        label="Duração (dias):"
                        placeholder="ex: 7"
                        type="numeric"
                        maxLength={5}
                        value={duration}
                        onChangeText={setDuration}
                        customStylesContainer={{ width: "50%" }}
                    />
                </View>


                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Forma Geométrica</Text>
                    <View style={styles.shapesContainer}>
                        {shapes.map((shape) => (
                            <TouchableOpacity
                                key={shape.id}
                                style={[
                                    styles.shapeButton,
                                    selectedShape === shape.id && styles.shapeButtonActive,
                                ]}
                                onPress={() => setSelectedShape(shape.id)}
                            >
                                {renderShape(shape.id as 'circle' | 'square' | 'triangle', 40, "#333")}
                                <Text
                                    style={[
                                        styles.shapeLabel,
                                        selectedShape === shape.id && styles.shapeLabelActive,
                                    ]}
                                >
                                    {shape.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Cor</Text>
                    <View style={styles.colorsContainer}>
                        {colors?.map((color) => (
                            <TouchableOpacity
                                key={color.id}
                                onPress={() => setSelectedColor(color.id)}
                            >
                                <View
                                    style={[
                                        styles.colorButton,
                                        { backgroundColor: color.hex },
                                        selectedColor === color.id && styles.colorButtonActive,
                                    ]}
                                />
                                <Text style={styles.colorLabel}>{color.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.buttonSaveContainer}>
                <Button
                    title="Salvar Medicamento"
                    onPress={handleSaveMedication}
                    icon="save"
                    type="success"
                    disabled={!formValidate()}
                />
            </View>
        </ScrollView>
    )
}