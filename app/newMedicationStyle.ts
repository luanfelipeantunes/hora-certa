import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    title: {
        fontSize: 32,
        fontWeight: "bold",
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 16,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        fontWeight: "600",
        color: "#757575",
        marginBottom: 32,
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: "center",
    },
    dropDownContainer: {
        paddingHorizontal: 16,
        zIndex: 1000,
        width: "68%",
        marginLeft: -16,
    },
    dropDown: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 12,
        boxShadow: "inset 0px 1px 4px rgba(0, 0, 0, 0.12)",
    },
    dropDownStyle: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 12,
        boxShadow: "inset 0px 1px 4px rgba(0, 0, 0, 0.12)",
        marginLeft: 16,
    },
    periodicityContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    sectionContainer: {
        marginHorizontal: 16,
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
        color: "#333",
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    shapesContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 24,
    },
    shapeButton: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#ccc",
        backgroundColor: "#f9f9f9",
    },
    shapeButtonActive: {
        borderColor: "#007AFF",
        backgroundColor: "#E3F2FD",
    },
    shapeLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginTop: 8,
    },
    shapeLabelActive: {
        color: "#007AFF",
    },
    colorsContainer: {
        flexDirection: "row",
        gap: 24,
        alignItems: "center",
    },
    colorButton: {
        width: 60,
        height: 60,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
    },
    colorButtonActive: {
        borderColor: "#333",
    },
    colorLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        marginTop: 8,
        textAlign: "center",
    },
    buttonSaveContainer: {
        marginVertical: 24,
        paddingHorizontal: 16,
    },
})