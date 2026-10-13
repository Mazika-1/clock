package dev.mazzen.clock

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.WebView

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var bridge: ClockBridge
    private var fullscreen = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val bg = Color.parseColor("#0B0D12")
        window.statusBarColor = bg
        window.navigationBarColor = bg

        webView = WebView(this)
        webView.setBackgroundColor(bg) // no white flash while the page loads
        webView.isVerticalScrollBarEnabled = false
        setContentView(webView)

        val s = webView.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true            // settings, presets and the game in progress
        s.allowFileAccess = true
        s.mediaPlaybackRequiresUserGesture = false  // clock sounds

        bridge = ClockBridge(this)
        webView.addJavascriptInterface(bridge, "ClockApp")

        webView.loadUrl("file:///android_asset/www/index.html")
    }

    fun setKeepAwake(on: Boolean) = runOnUiThread {
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    fun setFullscreen(on: Boolean) = runOnUiThread {
        fullscreen = on
        applyFullscreen()
        webView.evaluateJavascript("window.__clockAppFullscreen && window.__clockAppFullscreen($on)", null)
    }

    @Suppress("DEPRECATION")
    private fun applyFullscreen() {
        if (Build.VERSION.SDK_INT >= 30) {
            val c = window.insetsController ?: return
            if (fullscreen) {
                c.hide(WindowInsets.Type.systemBars())
                c.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            } else c.show(WindowInsets.Type.systemBars())
        } else {
            window.decorView.systemUiVisibility = if (fullscreen)
                View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            else View.SYSTEM_UI_FLAG_VISIBLE
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus && fullscreen) applyFullscreen()
    }

    override fun onPause() {
        super.onPause()
        // the page saves the game when it is hidden
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (fullscreen) { setFullscreen(false); return }
        @Suppress("DEPRECATION")
        super.onBackPressed()
    }

    override fun onDestroy() {
        bridge.shutdown()
        webView.destroy()
        super.onDestroy()
    }
}
