package dev.mazzen.clock

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Keeps the app up to date from the GitHub releases (every push to main publishes one, tagged
 * apk-<build number>, the same number as the app's versionCode).
 *
 *  - While the app is open it checks for a newer build and downloads it in the background.
 *  - Android 12+, once this app installed the version that's running (true from the first
 *    self-update on): the download installs by itself when you leave the app, so a game is never
 *    cut off. Next time you open it, it's the new version.
 *  - Otherwise (the first update, or Android 11 and older) Android has to ask: the update is
 *    offered the next time you open the app, as Android's own "Update this app?" screen.
 */
object Updater {
    private const val LATEST = "https://api.github.com/repos/Mazika-1/clock/releases/latest"
    private const val APK = "Clock.apk"

    private fun file(c: Context) = File(c.cacheDir, "update.apk")
    private fun prefs(c: Context) = c.getSharedPreferences("update", Context.MODE_PRIVATE)

    @Suppress("DEPRECATION")
    private fun current(c: Context): Long {
        val info = c.packageManager.getPackageInfo(c.packageName, 0)
        return if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else info.versionCode.toLong()
    }

    // a downloaded build newer than the one running
    private fun ready(c: Context): Boolean = prefs(c).getLong("ready", 0) > current(c) && file(c).exists()

    // Android installs it without asking only on 12+ and when this app installed itself
    private fun silent(c: Context): Boolean {
        if (Build.VERSION.SDK_INT < 31) return false
        return try { c.packageManager.getInstallSourceInfo(c.packageName).installingPackageName == c.packageName } catch (_: Exception) { false }
    }

    /** As the app opens: offer an update Android has to ask about, then look for a newer one. */
    fun onOpen(a: Activity) {
        if (prefs(a).getLong("ready", 0) <= current(a)) file(a).delete()      // already running it
        if (ready(a) && !silent(a)) install(a)
        thread { try { fetch(a) } catch (_: Exception) {} }                   // offline is fine: try next time
    }

    /** As you leave the app: install a downloaded update quietly, if Android lets us. */
    fun onLeave(c: Context) {
        if (ready(c) && silent(c)) install(c)
    }

    private fun fetch(c: Context) {
        val rel = JSONObject(get(LATEST).bufferedReader().use { it.readText() })
        val build = rel.optString("tag_name").removePrefix("apk-").toLongOrNull() ?: return
        if (build <= current(c) || (build == prefs(c).getLong("ready", 0) && file(c).exists())) return
        val assets = rel.getJSONArray("assets")
        var url: String? = null
        for (i in 0 until assets.length()) {
            val a = assets.getJSONObject(i)
            if (a.optString("name") == APK) url = a.optString("browser_download_url")
        }
        if (url == null) return
        val part = File(c.cacheDir, "update.part")
        get(url).use { input -> part.outputStream().use { input.copyTo(it) } }
        if (part.length() < 100_000) { part.delete(); return }                // not an app
        part.renameTo(file(c))
        prefs(c).edit().putLong("ready", build).apply()
    }

    private fun get(url: String) = (URL(url).openConnection() as HttpURLConnection).run {
        connectTimeout = 15000; readTimeout = 60000; instanceFollowRedirects = true
        setRequestProperty("Accept", if (url == LATEST) "application/vnd.github+json" else "application/octet-stream")
        setRequestProperty("User-Agent", "dev.mazzen.clock")
        inputStream
    }

    private fun install(c: Context) {
        try {
            val f = file(c)
            val pi = c.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
            params.setAppPackageName(c.packageName)
            if (Build.VERSION.SDK_INT >= 31) params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
            val id = pi.createSession(params)
            pi.openSession(id).use { s ->
                s.openWrite("clock.apk", 0, f.length()).use { out -> f.inputStream().use { it.copyTo(out) }; s.fsync(out) }
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
                val done = PendingIntent.getBroadcast(c, id, Intent(c, InstallResult::class.java), flags)
                s.commit(done.intentSender)
            }
        } catch (_: Exception) {}
    }
}

/** Android's answer to an install: when it needs you to confirm, show its screen. */
class InstallResult : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        if (i.getIntExtra(PackageInstaller.EXTRA_STATUS, -999) != PackageInstaller.STATUS_PENDING_USER_ACTION) return
        @Suppress("DEPRECATION")
        val confirm = i.getParcelableExtra<Intent>(Intent.EXTRA_INTENT) ?: return
        try { c.startActivity(confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
    }
}
