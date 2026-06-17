import BottomMenu from "@/components/bottomMenu/BottomMenu";
import Header from "@/components/header/Header";
import { syncMedicationNotifications } from "@/utils/MedicationNotifications";
import notifee, { AndroidNotificationSetting, EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, usePathname, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { Alert, AppState, Platform, View } from "react-native";

// --- INÍCIO DO MOCK DO NOTIFEE ---
// let notifee: any;
// let EventType: any = { PRESS: 0, ACTION_PRESS: 1 };
// let AndroidNotificationSetting: any = { ENABLED: 1 };

// notifee = {
//     requestPermission: async () => { },
//     getNotificationSettings: async () => ({ android: { alarm: AndroidNotificationSetting.ENABLED } }),
//     openAlarmPermissionSettings: async () => { },
//     getInitialNotification: async () => null,
//     getDisplayedNotifications: async () => [],
//     onForegroundEvent: (callback: any) => () => { },
//     onBackgroundEvent: (callback: any) => () => { },
// };
// --- FIM DO MOCK DO NOTIFEE ---

// O BackgroundEvent assume o controle antes mesmo do React renderizar
notifee.onBackgroundEvent(async ({ type, detail }: { type: number; detail: any }) => {
  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    console.log("App aberto via background pelo Alarme", detail.notification?.data);
  }
});

export default function RootLayout() {
  const pathname = usePathname();
  const navigationState = useRootNavigationState();

  // EFFECT 1: PREPARAR NOTIFICAÇÕES AO INICIAR O APP
  useEffect(() => {
    let isMounted = true;

    const prepareNotifications = async () => {
      await notifee.requestPermission({
        alert: true,
        badge: true,
        sound: true,
      });

      if (Platform.OS === 'android') {
        const settings = await notifee.getNotificationSettings();

        if (settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
          Alert.alert(
            "Despertador Bloqueado pelo Android",
            "Para o celular tocar com a tela bloqueada, você precisa permitir 'Alarmes e Lembretes' na próxima tela.",
            [
              { text: "Agora não", style: "cancel" },
              { text: "Ativar Despertador", onPress: async () => await notifee.openAlarmPermissionSettings() }
            ]
          );
          return;
        }
      }

      const storedMedicationsStr = await AsyncStorage.getItem("medications");
      const storedMedications: any[] = storedMedicationsStr ? JSON.parse(storedMedicationsStr) : [];
      const updatedMedications = await syncMedicationNotifications(storedMedications);

      if (isMounted) {
        await AsyncStorage.setItem("medications", JSON.stringify(updatedMedications));
      }
    };

    prepareNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  // EFFECT 2: INTERCEPTAR ALARMES (Garante o Redirecionamento)
  useEffect(() => {
    if (!navigationState?.key) return;

    const navigateToMedicationAlert = (medicationId?: string | number | null) => {
      if (medicationId) {
        console.log("Navegando via replace para /alertScreen com ID:", medicationId);
        router.replace({
          pathname: "/alertScreen",
          params: { medicationId: String(medicationId) },
        });
      }
    };

    const checkAlarmsAndRedirect = async () => {
      try {
        // 1. Checa Cold Start (App acordou do zero)
        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification?.notification?.data?.medicationId) {
          const id = initialNotification.notification.data.medicationId;
          setTimeout(() => navigateToMedicationAlert(id as string), 300);
          return;
        }

        // 2. Checa Notificações Ativas na Barra do Celular
        const displayed = await notifee.getDisplayedNotifications();
        const activeAlarm = displayed.find((n: any) => n.notification.data?.medicationId);
        if (activeAlarm) {
          navigateToMedicationAlert(activeAlarm.notification.data?.medicationId as string);
        }
      } catch (err) {
        console.error("Erro ao checar notificações iniciais:", err);
      }
    };

    // Executa a checagem na primeira vez que as rotas montam
    checkAlarmsAndRedirect();

    // 3. OUVINTE DE ESTADO DO APP
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log("App voltou para o primeiro plano. Checando alarmes tocando...");
        checkAlarmsAndRedirect();
      }
    });

    // 4. OUVINTE DE CLIQUE NA NOTIFICAÇÃO
    const foregroundUnsubscribe = notifee.onForegroundEvent(({ type, detail }: { type: number; detail: any }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        const medicationId = detail.notification?.data?.medicationId as string | number | null | undefined;
        navigateToMedicationAlert(medicationId);
      }
    });

    return () => {
      appStateSubscription.remove();
      foregroundUnsubscribe();
    };
  }, [navigationState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header />

      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>

      {pathname !== "/alertScreen" && <BottomMenu />}
    </View>
  );
}