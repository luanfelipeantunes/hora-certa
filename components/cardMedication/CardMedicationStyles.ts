import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: "#e9e8e8",
        borderWidth: 1,
        borderColor: "#FFF",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0px 2px 16px rgba(0, 0, 0, 0.1)",
        gap: 24,
    },
    rowContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 24,
    },
    shapeAndColor: {
        width: 55,
        height: 55,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    infoContainer: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    medicationName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1F2937",
    },
    medicationDescription: {
        width: "83%",
        fontSize: 14,
        color: "#4e4b4b",
    }

})