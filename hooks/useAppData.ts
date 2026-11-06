import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadData, subscribeToDataChanges, type AppData } from "@/utils/storage";

/** Dados salvos, recarregados quando a tela ganha foco ou quando algo é alterado. */
export function useAppData() {
    const [data, setData] = useState<AppData>({ medications: [], snoozes: [] });
    const [loading, setLoading] = useState(true);
    const mounted = useRef(true);

    const reload = useCallback(async () => {
        const next = await loadData();
        if (mounted.current) {
            setData(next);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        const unsubscribe = subscribeToDataChanges(reload);
        return () => {
            mounted.current = false;
            unsubscribe();
        };
    }, [reload]);

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

    return { ...data, loading, reload };
}
