import moment, { type Moment } from "moment";
import "moment/locale/pt-br";

moment.locale("pt-br");

export const DATE_FORMAT = "YYYY-MM-DD";
export const TIME_FORMAT = "HH:mm";
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Hoje", "Amanhã", "Ontem" ou "06/11". */
export const formatDayLabel = (date: Moment, now: Moment = moment()) => {
    if (date.isSame(now, "day")) return "Hoje";
    if (date.isSame(now.clone().add(1, "day"), "day")) return "Amanhã";
    if (date.isSame(now.clone().subtract(1, "day"), "day")) return "Ontem";
    return date.format("DD/MM");
};

/** "Quinta-feira, 6 de novembro". */
export const formatLongDate = (date: Moment) => capitalize(date.format("dddd, D [de] MMMM"));

export const greeting = (now: Moment = moment()) => {
    const hour = now.hour();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
};

/** "daqui a 2 h 15 min", "daqui a 5 min", "agora". */
export const formatTimeUntil = (target: Moment, now: Moment = moment()) => {
    const totalMinutes = Math.ceil(target.diff(now, "seconds") / 60);

    if (totalMinutes <= 0) return "agora";

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `daqui a ${days} ${days === 1 ? "dia" : "dias"}${hours ? ` e ${hours} h` : ""}`;
    if (hours > 0) return `daqui a ${hours} h${minutes ? ` ${minutes} min` : ""}`;
    return `daqui a ${minutes} min`;
};

/** "a", "a e b", "a, b e c". */
export const formatList = (items: string[]) => {
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
};

export { moment };
export type { Moment };
