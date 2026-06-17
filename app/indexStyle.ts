import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        width: '90%',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    nextMedicationTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 16,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    nextMedicationContainer: {
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 24,
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
    medicationTime: {
        fontSize: 24,
        fontWeight: "bold",
    },
    medicationName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "red",
    },
    medicationDose: {
        fontSize: 18,
        color: "#555",
        fontStyle: "italic",
    }
})