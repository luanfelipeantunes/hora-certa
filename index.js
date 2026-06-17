import notifee, { EventType } from '@notifee/react-native';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// --- INÍCIO DO MOCK DO NOTIFEE ---
// let notifee;
// let EventType = { DELIVERED: 0 };
// notifee = { onBackgroundEvent: async () => { } };
// --- FIM DO MOCK DO NOTIFEE ---

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    console.log("Alarme disparou em background!", detail.notification);
  }
});

export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);