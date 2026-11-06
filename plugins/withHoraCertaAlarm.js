/**
 * Config plugin do Hora Certa (Android).
 *
 * Faz o alarme de remédio se comportar como um despertador de verdade:
 *  1. Cria o canal de notificação com som de ALARME (AudioAttributes.USAGE_ALARM).
 *     O notifee sempre cria canais com USAGE_NOTIFICATION, que fica mudo quando o
 *     celular está no silencioso. Com USAGE_ALARM o som segue o volume de alarme.
 *  2. Copia o som do alarme e o ícone pequeno da notificação para os recursos nativos.
 *  3. Permite que a tela do app apareça por cima da tela de bloqueio e acenda a tela
 *     (showWhenLocked / turnScreenOn), necessário para o "fullScreenAction" funcionar.
 *
 * O ID do canal e o nome do som precisam bater com utils/alarms.ts.
 */
const fs = require("fs");
const path = require("path");
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require("expo/config-plugins");

const CHANNEL_ID = "hora-certa-alarm-v1";
const CHANNEL_NAME = "Alarme dos remédios";
const CHANNEL_DESCRIPTION = "Toca como despertador na hora de tomar cada remédio";
const SOUND_FILE = "hora_certa_alarm.wav";
const SOUND_NAME = "hora_certa_alarm";
const SMALL_ICON = "ic_stat_hora_certa";
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
const MARKER = "// @hora-certa: canal de alarme";

const KOTLIN_CHANNEL_SNIPPET = `
    ${MARKER}
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      try {
        val alarmNotificationManager = getSystemService(android.app.NotificationManager::class.java)
        if (alarmNotificationManager != null && alarmNotificationManager.getNotificationChannel("${CHANNEL_ID}") == null) {
          val alarmChannel = android.app.NotificationChannel(
            "${CHANNEL_ID}",
            "${CHANNEL_NAME}",
            android.app.NotificationManager.IMPORTANCE_HIGH
          )
          alarmChannel.description = "${CHANNEL_DESCRIPTION}"
          alarmChannel.lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
          alarmChannel.enableVibration(true)
          alarmChannel.vibrationPattern = longArrayOf(0, 800, 400, 800, 400, 800)
          alarmChannel.enableLights(true)
          alarmChannel.setBypassDnd(true)
          val alarmAudioAttributes = android.media.AudioAttributes.Builder()
            .setUsage(android.media.AudioAttributes.USAGE_ALARM)
            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
          alarmChannel.setSound(
            android.net.Uri.parse("android.resource://" + packageName + "/raw/${SOUND_NAME}"),
            alarmAudioAttributes
          )
          alarmNotificationManager.createNotificationChannel(alarmChannel)
        }
      } catch (e: Exception) {
        android.util.Log.w("HoraCerta", "Falha ao criar o canal de alarme", e)
      }
    }
`;

function withLockScreenActivity(config) {
  return withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    activity.$["android:showWhenLocked"] = "true";
    activity.$["android:turnScreenOn"] = "true";
    return cfg;
  });
}

function withAlarmResources(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const { projectRoot, platformProjectRoot } = cfg.modRequest;
      const resDir = path.join(platformProjectRoot, "app", "src", "main", "res");

      const rawDir = path.join(resDir, "raw");
      fs.mkdirSync(rawDir, { recursive: true });
      fs.copyFileSync(
        path.join(projectRoot, "assets", "sounds", SOUND_FILE),
        path.join(rawDir, SOUND_FILE)
      );
      // Impede que o "resource shrinking" remova recursos usados só pelo nome.
      fs.writeFileSync(
        path.join(rawDir, "hora_certa_keep.xml"),
        '<?xml version="1.0" encoding="utf-8"?>\n' +
          `<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="@raw/${SOUND_NAME},@drawable/${SMALL_ICON}" />\n`
      );

      for (const density of DENSITIES) {
        const target = path.join(resDir, `drawable-${density}`);
        fs.mkdirSync(target, { recursive: true });
        fs.copyFileSync(
          path.join(projectRoot, "assets", "android", `drawable-${density}`, `${SMALL_ICON}.png`),
          path.join(target, `${SMALL_ICON}.png`)
        );
      }

      return cfg;
    },
  ]);
}

function withAlarmChannel(config) {
  return withMainApplication(config, (cfg) => {
    const { modResults } = cfg;

    if (modResults.language !== "kt") {
      throw new Error("[withHoraCertaAlarm] Esperava MainApplication em Kotlin.");
    }

    if (!modResults.contents.includes(MARKER)) {
      const onCreatePattern = /(override fun onCreate\(\)\s*\{\s*\n\s*super\.onCreate\(\))/;

      if (!onCreatePattern.test(modResults.contents)) {
        throw new Error("[withHoraCertaAlarm] Não encontrei super.onCreate() no MainApplication.");
      }

      modResults.contents = modResults.contents.replace(
        onCreatePattern,
        (match) => `${match}\n${KOTLIN_CHANNEL_SNIPPET}`
      );
    }

    return cfg;
  });
}

module.exports = function withHoraCertaAlarm(config) {
  config = withLockScreenActivity(config);
  config = withAlarmResources(config);
  config = withAlarmChannel(config);
  return config;
};
