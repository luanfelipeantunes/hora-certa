package expo.modules.alarmdevice

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Recursos do Android que o notifee não oferece, usados para garantir que o alarme
 * realmente apareça e seja ouvido:
 * - permissão de notificação em tela cheia (Android 14+ vem negada para apps instalados por APK);
 * - volume do alarme;
 * - pedido direto para ignorar a economia de bateria.
 */
class AlarmDeviceModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("Contexto do app indisponível")

  override fun definition() = ModuleDefinition {
    Name("AlarmDevice")

    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        context.getSystemService(NotificationManager::class.java)?.canUseFullScreenIntent() ?: true
      } else {
        true
      }
    }

    Function("openFullScreenIntentSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        openSettings(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
      } else {
        openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      }
    }

    Function("getAlarmVolume") {
      val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      mapOf(
        "current" to audio.getStreamVolume(AudioManager.STREAM_ALARM),
        "max" to audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)
      )
    }

    Function("isIgnoringBatteryOptimizations") {
      val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      power.isIgnoringBatteryOptimizations(context.packageName)
    }

    Function("requestIgnoreBatteryOptimizations") {
      openSettings(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
    }
  }

  /** Abre uma tela de ajustes já apontando para este app. Retorna false se não conseguiu. */
  private fun openSettings(action: String): Boolean {
    val packageUri = Uri.parse("package:" + context.packageName)
    val starter = appContext.currentActivity ?: context

    return try {
      starter.startActivity(Intent(action, packageUri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      true
    } catch (error: Exception) {
      try {
        starter.startActivity(
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      } catch (_: Exception) {
        // Sem tela de ajustes disponível.
      }
      false
    }
  }
}
