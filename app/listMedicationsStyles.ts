import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    medicationsTitle: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#797575",
        textAlign: "center",
        marginBottom: 24,
    },
    medicationsContainer: {
        flex: 1,
        paddingHorizontal: 16,
        gap: 16,
    },
    noMedicationsText: {
        fontSize: 16,
        color: "#4e4b4b",
        textAlign: "center",
        marginTop: 32,
    }
})