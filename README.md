# ⏰ Hora Certa

O Hora Certa é um aplicativo (React Native + Expo) que ajuda idosos a tomar o remédio certo na hora certa.

O enfermeiro ou médico cadastra cada remédio com uma **forma geométrica** e uma **cor** e desenha o mesmo símbolo na caixa do remédio. Na hora de tomar, o celular **toca como um despertador** e mostra, em tela cheia, o símbolo da caixa que deve ser pega.

--------------------------------------------------------------------------------
🚀 FUNCIONALIDADES
--------------------------------------------------------------------------------

* **Despertador de verdade (Android):** som próprio no volume de ALARME (toca mesmo no modo silencioso), repete até a confirmação, acende a tela e abre o alerta por cima da tela de bloqueio.
* **Tela de alerta simples:** símbolo grande, nome, como tomar, "Pegue a caixa com a estrela vermelha", botão **JÁ TOMEI** e **Lembrar em 10 minutos**.
* **Vários remédios no mesmo horário** viram um único alarme, com todos na mesma tela.
* **Horários fixos:** "a cada 8 horas a partir de 08:00" = 08:00, 16:00, 00:00. Confirmar atrasado não empurra os próximos horários.
* **Tratamento por alguns dias ou uso contínuo.**
* **6 formas × 8 cores**, com aviso se dois remédios em uso tiverem o mesmo símbolo.
* **Tela "Hoje":** próximo remédio, doses do dia (tomado / não confirmado) e confirmação antecipada.
* **Editar e excluir remédios** (com confirmação).
* **Aba Ajustes:** verifica o que impede o alarme de tocar (notificações, alarme exato, tela cheia, economia de bateria, volume do alarme) e tem o botão **Testar o alarme**.
* **Funciona offline:** tudo fica salvo no aparelho (AsyncStorage).
* Fonte Atkinson Hyperlegible (feita para pessoas com baixa visão), textos e botões grandes.

Detalhes técnicos do alarme: [docs/medication-notifications.md](docs/medication-notifications.md).

--------------------------------------------------------------------------------
🛠️ TECNOLOGIAS
--------------------------------------------------------------------------------

* React Native 0.81 + Expo SDK 54 (Expo Router, Dev Client)
* @notifee/react-native (alarmes e notificações)
* Config plugin próprio em `plugins/withHoraCertaAlarm.js` (canal de alarme nativo, som e tela sobre o bloqueio)
* Módulo nativo local em `modules/alarm-device` (permissão de tela cheia, volume do alarme)
* AsyncStorage, Moment.js

> O app usa código nativo (notifee + plugin), então **não funciona no Expo Go**. Use um build (development ou preview).

--------------------------------------------------------------------------------
📦 RODANDO LOCALMENTE
--------------------------------------------------------------------------------

Pré-requisitos: Node.js 20.19+ e Android Studio (ou um celular Android com depuração USB).

```bash
npm install
npx expo run:android      # gera o app nativo, instala e inicia o Metro
```

Depois da primeira vez, basta `npx expo start` com o app de desenvolvimento instalado.

Sempre que mudar `app.json`, ícones, sons ou o plugin, gere o app nativo de novo (`npx expo run:android` ou um novo build EAS).

### Testes

```bash
npm test     # regras de horário, agrupamento de alarmes e migração dos dados
npm run lint
```

--------------------------------------------------------------------------------
📱 GERANDO O APK (EAS)
--------------------------------------------------------------------------------

```bash
eas build --platform android --profile preview
```

Use o perfil **preview** para instalar no celular do paciente. O perfil `development` gera um app de desenvolvimento, que abre a tela do Expo pedindo um servidor.

Depois de instalar, abra a aba **Ajustes**, corrija o que estiver em vermelho e use **Testar o alarme** com a tela bloqueada.

--------------------------------------------------------------------------------
📄 LICENÇA
--------------------------------------------------------------------------------

Este projeto está sob a licença MIT.
