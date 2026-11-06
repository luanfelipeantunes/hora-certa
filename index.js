// Ponto de entrada do app.
// O handler de eventos em segundo plano do notifee precisa ser registrado antes do app
// ser montado, por isso fica aqui e não dentro de um componente.
import notifee from "@notifee/react-native";
import { handleBackgroundEvent } from "./utils/backgroundEvents";

notifee.onBackgroundEvent(handleBackgroundEvent);

// eslint-disable-next-line import/first
import "expo-router/entry";
