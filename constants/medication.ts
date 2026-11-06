import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ColorId, ShapeId } from "@/types/medication";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type ShapeOption = {
    id: ShapeId;
    label: string;
    /** Gênero gramatical, para concordar com a cor ("estrela vermelha", "círculo vermelho"). */
    gender: "m" | "f";
    icon: IconName;
    outline: IconName;
};

export type ColorOption = {
    id: ColorId;
    label: string;
    /** Nome da cor concordando com o gênero da forma. */
    adjective: { m: string; f: string };
    hex: string;
    /** Tom escuro usado no contorno do símbolo (dá contraste a cores claras como o amarelo). */
    dark: string;
    /** Fundo suave para destacar o símbolo. */
    soft: string;
};

/** Formas fáceis de desenhar à mão na caixa do remédio. */
export const SHAPES: ShapeOption[] = [
    { id: "circle", label: "Círculo", gender: "m", icon: "circle", outline: "circle-outline" },
    { id: "square", label: "Quadrado", gender: "m", icon: "square", outline: "square-outline" },
    { id: "triangle", label: "Triângulo", gender: "m", icon: "triangle", outline: "triangle-outline" },
    { id: "star", label: "Estrela", gender: "f", icon: "star", outline: "star-outline" },
    { id: "heart", label: "Coração", gender: "m", icon: "heart", outline: "heart-outline" },
    { id: "diamond", label: "Losango", gender: "m", icon: "rhombus", outline: "rhombus-outline" },
];

/** Cores comuns de canetinha/marcador, bem diferentes entre si. */
export const COLORS: ColorOption[] = [
    { id: "red", label: "Vermelho", adjective: { m: "vermelho", f: "vermelha" }, hex: "#DC2626", dark: "#7F1D1D", soft: "#FDE8E8" },
    { id: "blue", label: "Azul", adjective: { m: "azul", f: "azul" }, hex: "#2563EB", dark: "#1E3A8A", soft: "#E3ECFD" },
    { id: "yellow", label: "Amarelo", adjective: { m: "amarelo", f: "amarela" }, hex: "#FACC15", dark: "#854D0E", soft: "#FEF7D6" },
    { id: "green", label: "Verde", adjective: { m: "verde", f: "verde" }, hex: "#16A34A", dark: "#14532D", soft: "#E1F5E8" },
    { id: "orange", label: "Laranja", adjective: { m: "laranja", f: "laranja" }, hex: "#F97316", dark: "#7C2D12", soft: "#FEEBDD" },
    { id: "purple", label: "Roxo", adjective: { m: "roxo", f: "roxa" }, hex: "#9333EA", dark: "#581C87", soft: "#F1E6FD" },
    { id: "pink", label: "Rosa", adjective: { m: "rosa", f: "rosa" }, hex: "#EC4899", dark: "#831843", soft: "#FDE7F2" },
    { id: "black", label: "Preto", adjective: { m: "preto", f: "preta" }, hex: "#1F2937", dark: "#000000", soft: "#E7E9EC" },
];

const DEFAULT_SHAPE = SHAPES[0];
const DEFAULT_COLOR = COLORS[1];

export const getShape = (id?: string | null): ShapeOption =>
    SHAPES.find((shape) => shape.id === id) ?? DEFAULT_SHAPE;

export const getColor = (id?: string | null): ColorOption =>
    COLORS.find((color) => color.id === id) ?? DEFAULT_COLOR;

export const isShapeId = (value: unknown): value is ShapeId =>
    SHAPES.some((shape) => shape.id === value);

export const isColorId = (value: unknown): value is ColorId =>
    COLORS.some((color) => color.id === value);

/** Ex.: "estrela vermelha", "círculo azul". */
export const describeSymbol = (shapeId?: string | null, colorId?: string | null) => {
    const shape = getShape(shapeId);
    const color = getColor(colorId);
    return `${shape.label.toLowerCase()} ${color.adjective[shape.gender]}`;
};

/** Ex.: "a estrela vermelha", "o círculo azul". */
export const describeSymbolWithArticle = (shapeId?: string | null, colorId?: string | null) => {
    const shape = getShape(shapeId);
    return `${shape.gender === "f" ? "a" : "o"} ${describeSymbol(shapeId, colorId)}`;
};
