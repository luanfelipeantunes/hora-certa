import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16,
        gap: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#666262",
    },
    input: {
        width: "100%",
        height: 45,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#D7D7D7",
        borderRadius: 12,
        paddingHorizontal: 12,
        boxShadow: "inset 0px 1px 4px rgba(0, 0, 0, 0.12)",
        color: "#1F2937",
    },
    inputError: {
        borderColor: "#B42318",
        backgroundColor: "#FFF5F5",
    },
    errorText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#B42318",
        paddingLeft: 2,
    }
})