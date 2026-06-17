import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: 80,
        backgroundColor: "#fcfcfc",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        boxShadow: "0px -2px 16px rgba(0, 0, 0, 0.1)",
        zIndex: 100,
    },
    item: {
        width: "30%",
        alignItems: "center",
    },
    activeItem: {
        backgroundColor: "#78DC77",
        padding: 8,
        borderRadius: 8,
    }
})