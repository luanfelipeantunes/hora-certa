# Sistema de alarme dos remédios

Como o Hora Certa agenda, toca e confirma os alarmes. Arquivos principais:

| Arquivo | Papel |
| --- | --- |
| `utils/schedule.ts` | Regras de horário (funções puras, cobertas por testes) |
| `utils/alarms.ts` | Integração com o notifee: agendar, sincronizar, ler alarmes tocando, permissões |
| `utils/medicationActions.ts` | Ações do usuário (salvar, excluir, "Já tomei", adiar) + reagendamento |
| `utils/storage.ts` / `utils/normalize.ts` | Persistência no AsyncStorage e migração do formato antigo |
| `utils/backgroundEvents.ts` + `index.js` | Eventos com o app fechado |
| `components/AlarmWatcher.tsx` | Abre a tela de alerta quando um alarme toca |
| `app/alarm.tsx` | Tela de alerta ("JÁ TOMEI" / "Lembrar em 10 minutos") |
| `plugins/withHoraCertaAlarm.js` | Código nativo Android (canal com som de alarme, tela sobre o bloqueio) |
| `modules/alarm-device` | Módulo nativo (Kotlin): permissão de tela cheia, volume do alarme, pedido de bateria |

## Regras de horário

- **Grade fixa**: "a cada 8 horas a partir de 08:00" gera 08:00, 16:00, 00:00... Confirmar com atraso não empurra os próximos horários.
- **Duração**: `startDate + startTime + duration dias` (fim exclusivo). 7 dias de 8 em 8 horas = 21 doses.
- **Uso contínuo**: `duration: null`, sem data de fim.
- **Doses confirmadas** ficam em `takenDoses` (horário previsto, `"YYYY-MM-DD HH:mm"`); o histórico guarda 60 dias.

## Agendamento

1. Doses do mesmo horário viram **um único alarme** (um som, uma tela com todos os remédios).
2. Só os **próximos 120 horários** (48 no iOS) ficam agendados. O Android permite no máximo 500 alarmes por app e o iOS 64 notificações pendentes; a versão anterior agendava o tratamento inteiro (ex.: de hora em hora por 30 dias = 720 alarmes), estourava o limite e passava a recusar qualquer cadastro novo.
3. A sincronização (`syncAlarms`) compara o que está agendado no sistema com o que deveria estar e só cancela/cria a diferença. Isso também apaga alarmes "órfãos" (de remédios excluídos ou deixados pela versão antiga).
4. A agenda é completada ao abrir o app, ao voltar para ele, quando um alarme toca (inclusive com o app fechado) e sempre que algo é salvo.
5. O gatilho usa `AlarmType.SET_ALARM_CLOCK`, o tipo mais confiável do Android (funciona no modo soneca/Doze).

## Como o alarme toca (Android)

- Canal `hora-certa-alarm-v1`, criado no código nativo pelo plugin com `AudioAttributes.USAGE_ALARM`: o som segue o **volume de alarme** e toca mesmo com o celular no silencioso. (O notifee só cria canais com som de notificação, que fica mudo no silencioso.)
- Som próprio (`assets/sounds/hora_certa_alarm.wav`), repetido até a confirmação (`loopSound`), notificação fixa (`ongoing`), categoria `ALARM`.
- `fullScreenAction` + `showWhenLocked`/`turnScreenOn` na MainActivity: o celular acende e abre a tela de alerta por cima da tela de bloqueio.
- **Android 14+**: a permissão "notificação em tela cheia" pode vir negada (principalmente em APK instalado fora da Play Store). Sem ela o celular toca, mas a tela do remédio não abre sozinha. A aba Ajustes detecta isso (`modules/alarm-device`) e leva direto à tela de permissão.
- `lightUpScreen` só é usado quando a tela cheia **não** está permitida: acender a tela antes faz o Android, em celulares sem bloqueio de tela, mostrar só um aviso no topo em vez de abrir o alerta.

No iOS o alarme é uma notificação com som (`interruptionLevel: timeSensitive`); o sistema não permite abrir o app sozinho.

## Tela de alerta

- Mostra todos os remédios dos alarmes que estão tocando (um por remédio, sempre a dose mais recente, para nunca sugerir duas doses juntas).
- **JÁ TOMEI**: para o som, marca as doses como tomadas e reagenda.
- **Lembrar em 10 minutos**: para o som e cria um alarme adiado (`alarm-snoozes` no armazenamento), que sobrevive à sincronização.
- O botão "voltar" do Android fica bloqueado enquanto o alarme toca.

## Diagnóstico (aba Ajustes)

Verifica notificações, "Alarmes e lembretes" (alarme exato), alarme em tela cheia, economia de bateria, volume do alarme e o gerenciador de energia do fabricante, com botões para corrigir. O botão **Testar o alarme** faz o alarme tocar em 10 segundos.

## Dados salvos (AsyncStorage)

- `medications`: lista de remédios (`types/medication.ts`).
- `alarm-snoozes`: alarmes adiados.

Ao abrir, o app regrava os dados no formato atual (`normalizeMedication`), então registros da versão anterior continuam funcionando.
