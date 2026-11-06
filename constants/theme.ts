import { StyleSheet } from "react-native";

/**
 * Paleta pensada para idosos: fundo claro e quente, texto escuro com alto contraste
 * e cores da marca (azul-marinho, verde-sálvia e pêssego do ícone).
 */
export const colors = {
    background: "#F6F3EE",
    surface: "#FFFFFF",
    surfaceMuted: "#EFEAE3",
    border: "#E0DAD1",
    borderStrong: "#C9C1B6",

    text: "#1B2430",
    textMuted: "#4F5966",
    textSubtle: "#7B8490",

    primary: "#1F4E8C",
    primaryPressed: "#173D6F",
    primarySoft: "#E5EDF8",

    sage: "#5E8F70",
    sageSoft: "#E6F0E9",
    peach: "#F7B98B",
    peachSoft: "#FCEBDD",

    success: "#1E7A4A",
    successPressed: "#17623B",
    successSoft: "#E1F2E8",

    warning: "#8A5300",
    warningSoft: "#FFF0D1",

    danger: "#B42318",
    dangerPressed: "#912018",
    dangerSoft: "#FDECEA",

    white: "#FFFFFF",
    overlay: "rgba(17, 24, 39, 0.45)",
};

export const fonts = {
    regular: "AtkinsonHyperlegible_400Regular",
    bold: "AtkinsonHyperlegible_700Bold",
};

export const radius = {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999,
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const shadows = StyleSheet.create({
    card: {
        boxShadow: "0px 4px 18px rgba(27, 36, 48, 0.08)",
    },
    raised: {
        boxShadow: "0px 8px 24px rgba(27, 36, 48, 0.14)",
    },
});

/** Altura mínima de áreas de toque (maior que o padrão de 48 para facilitar o uso). */
export const TOUCH_MIN = 56;
