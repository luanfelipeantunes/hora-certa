import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { getAlarmHealth, type AlarmHealth } from "@/utils/alarms";

/** Situação das permissões do alarme, atualizada ao abrir a tela e ao voltar dos Ajustes do Android. */
export function useAlarmHealth() {
    const [health, setHealth] = useState<AlarmHealth | null>(null);
    const mounted = useRef(true);

    const refresh = useCallback(async () => {
        try {
            const next = await getAlarmHealth();
            if (mounted.current) setHealth(next);
        } catch (error) {
            console.warn("[useAlarmHealth] falha ao verificar permissões", error);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") refresh();
        });
        return () => {
            mounted.current = false;
            subscription.remove();
        };
    }, [refresh]);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    return { health, refresh };
}
