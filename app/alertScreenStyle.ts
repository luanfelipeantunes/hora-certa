import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    titleHourContainer: {
        alignItems: "center",
        marginTop: 32,
        marginBottom: 16
    },
    titleHour: {
        fontSize: 20,
        fontWeight: "600",
    },
    hour: {
        fontSize: 48,
        fontWeight: "600",
    },
    nextMedicationContainer: {
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 16,
        marginBottom: 24,
        backgroundColor: "#fcfcfc",
        padding: 16,
        borderRadius: 8,
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        boxShadow: "0px 2px 16px rgba(0, 0, 0, 0.1)",
        borderWidth: 3,
        borderColor: "#FFF"
    },
    shapeAndColor: {
        width: 80,
        height: 80,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    medicationTitle: {
        fontSize: 24,
        fontWeight: "600",
    },
    medicationDescription: {
        fontSize: 20,
        fontWeight: "600",
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: "#b60000",
        borderRadius: 32,
    },
})