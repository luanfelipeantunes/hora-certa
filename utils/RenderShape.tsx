import { JSX } from "react";
import { View } from "react-native";

export default function renderShape(
    shapeId: 'circle' | 'square' | 'triangle',
    size: number = 40,
    color: string = "#fff"
): JSX.Element | null {

    switch (shapeId) {
        case 'circle':
            return (
                <View
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: 3,
                        borderColor: color,
                    }}
                />
            );
        case 'square':
            return (
                <View
                    style={{
                        width: size,
                        height: size,
                        borderWidth: 3,
                        borderColor: color,
                        borderRadius: 6,
                    }}
                />
            );
        case 'triangle':
            return (
                <View
                    style={{
                        width: 0,
                        height: 0,
                        borderLeftWidth: size / 2,
                        borderRightWidth: size / 2,
                        borderBottomWidth: size,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderBottomColor: color,
                    }}
                />
            );
        default:
            return null;
    }
};