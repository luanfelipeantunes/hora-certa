import { StyleSheet } from "react-native";

export const style = StyleSheet.create({
    container: {
        width: "100%",
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0px 2px 16px rgba(0, 0, 0, 0.1)",
    },
    textIcon: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFF",
    },
    primaryButton: {
        backgroundColor: "#2563EB",
    },
    secondaryButton: {
        backgroundColor: "#6B7280",
    },
    successButton: {
        backgroundColor: "#78DC77",
        color: "#00390A"
    },
    dangerButton: {
        backgroundColor: "#B42318",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    icon: {
        fontSize: 18,
        color: "#FFF",
    },
    loadingIcon: {
        fontSize: 18,
        color: "#FFF",
    },
})