import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { moment, type Moment } from "@/utils/date";

/** Hora atual, atualizada a cada virada de minuto e quando o app volta para a tela. */
export function useNow(): Moment {
    const [now, setNow] = useState(() => moment());

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const schedule = () => {
            const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
            timeout = setTimeout(() => {
                setNow(moment());
                schedule();
            }, msToNextMinute);
        };

        schedule();

        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") setNow(moment());
        });

        return () => {
            clearTimeout(timeout);
            subscription.remove();
        };
    }, []);

    return now;
}
