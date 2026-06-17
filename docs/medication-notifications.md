# Sistema de alarme e notificacoes de medicamentos

Este arquivo documenta como o sistema de notificacoes/alarme de medicamentos funciona no app, com foco no comportamento hibrido entre Android e iOS.

## Visao geral

O fluxo atual usa `@notifee/react-native` para agendar, receber e reagir a notificacoes de medicamentos.

A ideia e simples:

- no Android, o app se comporta como um alarme real, com notificacao de alta prioridade, acendimento da tela e abertura em primeiro plano quando possivel;
- no iOS, o app respeita o modelo nativo de notificacoes, exibindo alerta visual e sonoro, sem forcar abertura imediata do app.

A rota de destino para a interacao com o alerta e sempre `/alertScreen`, levando o `medicationId` para que a tela saiba qual medicamento esta sendo tratado.

## Arquivos envolvidos

- [utils/MedicationNotifications.ts](/home/hmt-35/PMG-Hora_Certa/utils/MedicationNotifications.ts)
- [app/_layout.tsx](/home/hmt-35/PMG-Hora_Certa/app/_layout.tsx)

## O que cada parte faz

### 1. `MEDICATION_DATETIME_FORMAT`

Define o formato padrao usado para salvar e comparar datas e horas do medicamento.

Exemplo:

- `2026-05-29 08:00`

Esse formato e usado para:

- calcular o proximo horario;
- salvar `lastUse`;
- registrar a ocorrencia que disparou a notificacao.

### 2. `MEDICATION_NOTIFICATION_CHANNEL_ID`

Identificador fixo do canal de notificacoes no Android.

Ele e importante porque:

- o Android precisa de um canal para controlar importancia, som e comportamento visual;
- uma vez criado, o canal passa a ser a referencia para todas as notificacoes de medicamentos.

### 3. `ensureNotificationChannel()`

Funcao responsavel por criar o canal no Android antes de agendar notificacoes.

Comportamento atual:

- roda somente em Android;
- cria o canal `medication-reminders`;
- define `AndroidImportance.HIGH` para dar destaque;
- habilita som e vibracao.

Na pratica, isso prepara o terreno para que o alerta tenha comportamento forte no Android.

### 4. `getMedicationWindowEnd(medication)`

Calcula ate quando um medicamento ainda deve gerar ocorrencias.

Ela pega:

- `startDate`;
- `duration`.

Depois soma a duracao em dias e fecha no fim do dia.

Isso evita agendar notificacoes fora da janela valida do tratamento.

### 5. `getMedicationBaseOccurrence(medication)`

Determina a primeira ocorrencia valida do medicamento.

A logica considera:

- `startDate` + `startTime` como ponto inicial;
- `lastUse`, quando existe, para continuar a sequencia a partir da ultima toma registrada;
- `periodicity.recurrency` e `periodicity.unit` para calcular a repeticao.

Se faltarem dados essenciais, a funcao retorna `null`.

### 6. `getMedicationOccurrences(medication, reference)`

Gera todas as ocorrencias futuras validas do medicamento dentro da janela de tratamento.

A funcao faz duas coisas:

- avanca a primeira ocorrencia ate ficar no presente ou no futuro;
- adiciona sucessivas ocorrencias ate chegar ao fim da janela.

O resultado e uma lista de momentos em que o alerta deve disparar.

### 7. `getNextMedication(storedMedications)`

Encontra a proxima ocorrencia global entre todos os medicamentos salvos.

Ela:

- percorre todos os medicamentos;
- calcula suas ocorrencias futuras;
- ordena pelo horario mais proximo;
- retorna o primeiro resultado.

Essa funcao e util para telas de resumo ou widgets que precisem mostrar "o proximo remdio".

### 8. `cancelMedicationNotifications(medication)`

Cancela notificacoes previamente agendadas para um medicamento.

Ela procura os IDs salvos em:

- `notificationIds`;
- ou `notificationId`, para compatibilidade com registros antigos.

Depois cancela cada uma via Notifee.

Esse passo evita duplicar alarmes quando o usuario edita o medicamento ou quando o sistema sincroniza tudo de novo.

### 9. `scheduleMedicationOccurrence(medication, occurrence)`

Essa e a parte central do agendamento.

Ela monta a notificacao com dados compartilhados entre Android e iOS e dispara o agendamento com trigger por timestamp.

#### No Android

O bloco `android` define o comportamento de alarme:

- `channelId`: usa o canal de medicamentos;
- `category: AndroidCategory.ALARM`: classifica como alarme;
- `pressAction`: define a acao ao tocar na notificacao;
- `fullScreenAction`: habilita abertura em tela cheia, usada em cenarios de alerta forte;
- `ongoing: true`: ajuda a tratar como alerta persistente;
- `sound: "default"`: garante som padrao do sistema.

O `alarmManager: true` no trigger reforca que o Android deve tratar a notificacao como alarme de alta prioridade.

#### No iOS

O bloco `ios` usa:

- `interruptionLevel: "timeSensitive"`;
- `sound: "default"`.

Isso faz com que a notificacao seja tratada como relevante, mas ainda respeite as regras do iPhone e do iPad. O app nao tenta forcar abertura da tela, porque o iOS nao permite esse comportamento como o Android.

#### Dados salvos na notificacao

Cada alerta carrega `data` com:

- `medicationId`;
- `medicationOccurrence`.

Esses dados sao o elo entre o disparo da notificacao e a tela de alerta.

### 10. `syncMedicationNotifications(medications)`

Essa funcao sincroniza tudo de uma vez.

Fluxo:

- cancela notificacoes antigas de cada medicamento;
- recalcula as ocorrencias futuras;
- agenda todas as notificacoes novas;
- salva de volta em cada medicamento:
  - `notificationId`;
  - `notificationIds`.

Ela e importante porque mantem o estado persistido coerente com o que foi realmente agendado no sistema operacional.

### 11. `markMedicationAsTaken(medications, medicationId)`

Atualiza o medicamento marcado como tomado.

Ela:

- encontra o item com o `id` correspondente;
- grava `lastUse` com o horario atual.

Depois disso, a proxima sincronizacao passa a calcular as ocorrencias a partir dessa nova tomada.

## Como o fluxo funciona no app

### 1. Inicializacao do app

Em [app/_layout.tsx](/home/hmt-35/PMG-Hora_Certa/app/_layout.tsx), o layout raiz faz a preparacao inicial:

- pede permissao de notificacao com `notifee.requestPermission()`;
- carrega a lista de medicamentos do `AsyncStorage`;
- chama `syncMedicationNotifications()`;
- salva de volta a lista atualizada com os IDs de notificacao.

Isso significa que, sempre que o app abre, o sistema de alarmes e revalidado.

### 2. Interacao com notificacoes em primeiro plano

Quando o app esta aberto, `notifee.onForegroundEvent()` escuta o evento de toque na notificacao.

Se o usuario tocar no alerta, o app:

- le `medicationId` de `detail.notification.data`;
- navega para `/alertScreen`.

### 3. Interacao com notificacoes em segundo plano

Quando o app nao esta em primeiro plano, `notifee.onBackgroundEvent()` faz o mesmo trabalho.

Ele garante que, ao tocar no alerta, o usuario continue sendo levado para a tela certa quando o sistema permitir a retomada do app.

### 4. Abertura inicial do app pela notificacao

Se o usuario abrir o app a partir da notificacao, `notifee.getInitialNotification()` recupera a interacao inicial e redireciona para `/alertScreen`.

Isso cobre o caso em que o app foi aberto diretamente pelo alerta.

## Diferença entre Android e iOS

### Android

Objetivo: agir como alarme real.

Resultado esperado:

- alerta com prioridade alta;
- canal dedicado;
- som;
- possibilidade de tela cheia;
- comportamento mais agressivo para chamar atenção.

### iOS

Objetivo: seguir o modelo nativo do sistema.

Resultado esperado:

- notificacao visivel;
- som;
- `timeSensitive` para aumentar a relevancia;
- sem tentativa de abrir o app automaticamente.

## Dados importantes persistidos

Cada medicamento pode guardar os seguintes campos relacionados a notificacao:

- `notificationId`;
- `notificationIds`;
- `lastUse`.

Esses campos permitem:

- cancelar o que ja foi agendado;
- reagendar corretamente;
- recalcular o proximo horario com base no uso real.

## Resumo do fluxo

1. O app abre.
2. O layout pede permissao e sincroniza os medicamentos.
3. O arquivo de notificacoes calcula as ocorrencias futuras.
4. O Notifee agenda os alarmes.
5. Quando chega o horario:
   - Android trata como alarme forte;
   - iOS exibe alerta tradicional.
6. Ao tocar no alerta, o app vai para `/alertScreen` com o `medicationId`.

## Observacoes importantes

- O canal Android e criado somente uma vez no fluxo de agendamento.
- A sincronizacao cancela notificacoes antigas antes de criar novas, evitando duplicidade.
- O uso de `medicationOccurrence` no payload ajuda a rastrear qual disparo especifico ocorreu.
- Se o app tiver rotinas de edicao de medicamento, e importante chamar `syncMedicationNotifications()` depois de salvar as alteracoes.

## Possivel evolucao futura

Se quiser deixar esse sistema ainda mais robusto, os proximos passos naturais seriam:

- criar tipos TypeScript para o modelo de medicamento;
- centralizar o acesso ao `AsyncStorage` num service unico;
- separar a logica de agendamento da logica de persistencia;
- registrar logs de falha para agendamento e cancelamento;
- adicionar uma tela de diagnostico para confirmar permissao, canal e proxima ocorrencia.
