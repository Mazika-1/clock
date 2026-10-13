package dev.mazzen.clock

import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import org.json.JSONArray

/**
 * The phone features Android's WebView doesn't give a web page on its own:
 * the voice announcer, vibration, keeping the screen on and fullscreen.
 * Exposed to the page as window.ClockApp; android-shim.js wires the
 * standard web APIs (speechSynthesis, navigator.vibrate, wakeLock,
 * requestFullscreen) through to it.
 */
class ClockBridge(private val activity: MainActivity) {

    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var pending: Pair<String, Float>? = null

    @JavascriptInterface
    fun speak(text: String, rate: Float) {
        val t = tts
        if (t == null) {
            pending = Pair(text, rate)
            tts = TextToSpeech(activity) { status ->
                ttsReady = status == TextToSpeech.SUCCESS
                pending?.let { (p, r) -> if (ttsReady) say(p, r) }
                pending = null
            }
            return
        }
        if (ttsReady) say(text, rate) else pending = Pair(text, rate)
    }

    private fun say(text: String, rate: Float) {
        tts?.setSpeechRate(rate)
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "clock")
    }

    @JavascriptInterface
    fun stopSpeaking() {
        tts?.stop()
    }

    @JavascriptInterface
    fun vibrate(json: String) {
        val v = activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
        if (!v.hasVibrator()) return
        // web pattern: [on, off, on, ...]; Android wants [delay, on, off, ...]
        val arr = try { JSONArray(json) } catch (_: Exception) { JSONArray().put(json.toLongOrNull() ?: 0L) }
        val ms = LongArray(arr.length() + 1)
        for (i in 0 until arr.length()) ms[i + 1] = arr.optLong(i).coerceIn(0L, 5000L)
        v.cancel()
        if (ms.drop(1).all { it == 0L }) return
        v.vibrate(VibrationEffect.createWaveform(ms, -1))
    }

    @JavascriptInterface
    fun keepAwake(on: Boolean) = activity.setKeepAwake(on)

    @JavascriptInterface
    fun setFullscreen(on: Boolean) = activity.setFullscreen(on)

    fun shutdown() {
        tts?.shutdown()
        tts = null
    }
}
