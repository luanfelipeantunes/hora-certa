import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: "#FAFAFA",
        paddingTop: 60,
        paddingBottom: 16,
        height: 120,
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0px 2px 16px rgba(0, 0, 0, 0.1)",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000",
    },
    icon: {
        position: "absolute",
        left: 16,
        top: '155%',
        fontSize: 24,
        color: "#5e5e5e",
    }
})