import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets, type Edge } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/constants/theme";
import AppText from "./AppText";

type ScreenProps = {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    /** Mostra o botão "Voltar" no topo. */
    showBack?: boolean;
    /** Conteúdo à direita do título. */
    headerRight?: ReactNode;
    /** Conteúdo fixo no rodapé (ex.: botão salvar). */
    footer?: ReactNode;
    scroll?: boolean;
    edges?: Edge[];
    contentStyle?: StyleProp<ViewStyle>;
};

export default function Screen({
    children,
    title,
    subtitle,
    showBack,
    headerRight,
    footer,
    scroll = true,
    edges = ["top"],
    contentStyle,
}: ScreenProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace("/");
    };

    const header =
        title || showBack ? (
            <View style={styles.header}>
                {showBack ? (
                    <Pressable
                        onPress={goBack}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                        hitSlop={8}
                        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                    >
                        <MaterialCommunityIcons name="chevron-left" size={30} color={colors.primary} />
                        <AppText variant="bodyLarge" bold color={colors.primary}>
                            Voltar
                        </AppText>
                    </Pressable>
                ) : null}

                {title ? (
                    <View style={styles.titleRow}>
                        <View style={styles.titleText}>
                            <AppText variant="title" accessibilityRole="header">
                                {title}
                            </AppText>
                            {subtitle ? (
                                <AppText variant="body" color={colors.textMuted}>
                                    {subtitle}
                                </AppText>
                            ) : null}
                        </View>
                        {headerRight}
                    </View>
                ) : null}
            </View>
        ) : null;

    const body = scroll ? (
        <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {header}
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.flex, styles.content, contentStyle]}>
            {header}
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={edges}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                {body}
                {footer ? (
                    <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>{footer}</View>
                ) : null}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.lg + 4,
        paddingTop: spacing.md,
        paddingBottom: spacing.xxl,
        gap: spacing.lg,
    },
    header: {
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingRight: 12,
        marginLeft: -8,
        borderRadius: radius.pill,
    },
    backButtonPressed: {
        backgroundColor: colors.primarySoft,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    titleText: {
        flex: 1,
        gap: 2,
    },
    footer: {
        paddingHorizontal: spacing.lg + 4,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});
