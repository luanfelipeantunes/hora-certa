/**
 * Ponte para o módulo nativo AlarmDevice (somente Android).
 * Em outras plataformas, ou num build sem o módulo, devolve valores neutros.
 */
import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

type AlarmDeviceNative = {
    canUseFullScreenIntent(): boolean;
    openFullScreenIntentSettings(): boolean;
    getAlarmVolume(): { current: number; max: number };
    isIgnoringBatteryOptimizations(): boolean;
    requestIgnoreBatteryOptimizations(): boolean;
};

const native = Platform.OS === "android" ? requireOptionalNativeModule<AlarmDeviceNative>("AlarmDevice") : null;

export const isAvailable = native !== null;

/** Android 14+: o app pode abrir a tela do alarme sozinho (por cima da tela de bloqueio)? */
export const canUseFullScreenIntent = () => native?.canUseFullScreenIntent() ?? true;

export const openFullScreenIntentSettings = () => native?.openFullScreenIntentSettings() ?? false;

/** Volume de alarme do celular (o mesmo do despertador). `null` se não disponível. */
export const getAlarmVolume = () => native?.getAlarmVolume() ?? null;

export const isIgnoringBatteryOptimizations = () => native?.isIgnoringBatteryOptimizations() ?? null;

/** Mostra o pedido do Android para o app rodar sem restrição de bateria. */
export const requestIgnoreBatteryOptimizations = () => native?.requestIgnoreBatteryOptimizations() ?? false;
