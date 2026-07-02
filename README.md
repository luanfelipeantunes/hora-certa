# ⏰ HORA CERTA - DOCUMENTAÇÃO DO REPOSITÓRIO

# Hora Certa

O Hora Certa é um aplicativo móvel desenvolvido em React Native com Expo, projetado especificamente para atuar como um gerenciador e despertador infalível de medicamentos. 

Ao contrário de aplicativos de lembretes convencionais que enviam apenas notificações simples (fáceis de ignorar ou limpar), o Hora Certa comporta-se como um despertador nativo real: emite som contínuo em loop e bloqueia o descarte da notificação até que o usuário interaja e confirme que tomou o medicamento.

--------------------------------------------------------------------------------
🚀 FUNCIONALIDADES PRINCIPAIS
--------------------------------------------------------------------------------

* Despertador Contínuo & Persistente: Som em loop contínuo e notificações fixas (ongoing) que não podem ser descartadas ao arrastar para o lado, garantindo o alerta efetivo do paciente.
* Modo Ecrã Inteiro (Full-Screen Intent): Capacidade de acordar o dispositivo, acender o ecrã bloqueado e abrir diretamente a aplicação na tela de alerta do medicamento atual (/alertScreen).
* Navegação Inteligente Baseada no Ciclo de Vida: Sistema avançado de sincronização (useRootNavigationState + AppState) que intercepta o alarme e garante o redirecionamento imediato para o alerta, funcionando perfeitamente em:
  - Cold Start: Quando a aplicação está totalmente fechada e é iniciada do zero por um alarme.
  - Background: Quando a aplicação está minimizada no histórico de apps recentes.
  - Foreground: Quando a aplicação já está aberta e em uso ativo.
* Gerenciamento Inteligente de Alarmes (Anti-Crash Android): Algoritmo de sincronização otimizado que limita o agendamento para, no máximo, as próximas 30 doses futuras, evitando que a aplicação estoure o limite de segurança de 500 alarmes concorrentes do sistema operacional.
* Persistência Local (Offline): Todo o histórico de medicamentos e logs de uso são mantidos de forma segura no próprio dispositivo utilizando AsyncStorage.
* Identificação Visual Rápida: Exibição dinâmica do formato e da cor customizada do medicamento para facilitar o reconhecimento visual por parte do utilizador.

--------------------------------------------------------------------------------
🛠️ TECNOLOGIAS UTILIZADAS
--------------------------------------------------------------------------------

* Framework Principal: React Native (https://reactnative.dev/)
* Ambiente & Roteamento: Expo (https://expo.dev/) (Expo Router, Expo Dev Client)
* Motor de Notificações e Alarmes Nativo: @notifee/react-native (https://notifee.app/)
* Armazenamento Local: @react-native-async-storage/async-storage
* Manipulação de Datas: Moment.js

--------------------------------------------------------------------------------
📦 COMO INSTALAR E EXECUTAR O PROJETO LOCALMENTE
--------------------------------------------------------------------------------

### Pré-requisitos
- Node.js instalado
- Ambiente React Native/Expo configurado (Android Studio ou dispositivo físico Android)
- EAS CLI instalado globalmente (npm install -g eas-cli)

### Passo a Passo

1. Clone o repositório:
   git clone https://github.com/seu-usuario/PMG-Hora_Certa.git
   cd PMG-Hora_Certa

2. Instale as dependências do projeto:
   npm install

3. Inicie o Metro Bundler (servidor de desenvolvimento):
   npx expo start

4. Execute o cliente de desenvolvimento nativo (Android):
   npx expo run:android

--------------------------------------------------------------------------------
📱 COMO GERAR A BUILD DE TESTES (.APK) VIA EAS
--------------------------------------------------------------------------------

O projeto está configurado para realizar compilações nativas diretamente na nuvem do Expo (EAS Build). Para gerar um ficheiro .apk instalável para testes em outros dispositivos:

1. Certifique-se de que o campo "slug" no seu ficheiro app.json está em letras minúsculas e sem espaços (ex: "hora-certa").
2. Execute o comando no terminal:
   eas build --platform android --profile preview
3. Aguarde a finalização do processo na nuvem. O terminal exibirá um QR Code e um link direto para download do ficheiro .apk.

--------------------------------------------------------------------------------
📄 LICENÇA
--------------------------------------------------------------------------------

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
