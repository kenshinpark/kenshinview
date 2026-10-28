package com.sevenmovies.tv

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.SystemClock
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.net.toUri
import kotlin.math.max
import kotlin.math.min

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var root: FrameLayout
    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private var chromeClient: WebChromeClient? = null

    // Tracks whether the WebView is displaying CSS fullscreen (player-box),
    // so the BACK key can exit it in one press.
    @Volatile
    private var isCssFullscreen = false

    // On-screen (virtual) mouse for Android TV remotes
    private var cursor: View? = null
    private var mouseEnabled = false
    private var cursorX = 0f
    private var cursorY = 0f
    private var isDragging = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Keep screen on during playback
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_main)
        root = findViewById(android.R.id.content)
        webView = findViewById(R.id.webview)
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        webView.isLongClickable = false
        webView.setOnLongClickListener { true }
        settings.domStorageEnabled = true
        settings.loadsImagesAutomatically = true
        settings.blockNetworkLoads = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.setSupportMultipleWindows(false)
        settings.javaScriptCanOpenWindowsAutomatically = false

        val assetLoader = androidx.webkit.WebViewAssetLoader.Builder()
            .addPathHandler("/", androidx.webkit.WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest): android.webkit.WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url) ?: super.shouldInterceptRequest(view, request)
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: android.webkit.WebResourceRequest): Boolean {
                val url = request.url
                // The app only owns the pages under appassets.androidplatform.net.
                // Any main-frame navigation to another host (or about:blank/null host)
                // must be blocked to prevent video player ad scripts from navigating
                // the top-level window away and turning the screen white.
                if (request.isForMainFrame) {
                    val host = url.host
                    if (host == null || !host.contains("appassets.androidplatform.net")) {
                        return true
                    }
                }
                return false
            }

            @Suppress("OVERRIDE_DEPRECATION")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val uri = url.toUri()
                val host = uri.host
                if (host == null || !host.contains("appassets.androidplatform.net")) {
                    return true
                }
                return false
            }
        }

        // Properly handle native fullscreen video (e.g. the embedded VidRift
        // player requesting fullscreen when its play button is tapped).
        val client = object : WebChromeClient() {
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                // Tear down a previously shown custom view first.
                if (customView != null) {
                    onHideCustomView()
                }
                if (view == null) return
                customView = view
                customViewCallback = callback
                view.layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                // The native fullscreen view covers the WebView. Hide the mouse
                // cursor so it isn't drawn behind it.
                cursor?.visibility = View.GONE
                webView.visibility = View.GONE
                hideCursor()
                val decor = window.decorView as ViewGroup
                decor.addView(view)
            }

            override fun onHideCustomView() {
                if (customView != null) {
                    val decor = window.decorView as ViewGroup
                    decor.removeView(customView)
                    customView = null
                    customViewCallback?.onCustomViewHidden()
                    customViewCallback = null
                    webView.visibility = View.VISIBLE
                    // Restore the mouse cursor (if the mouse is enabled).
                    if (mouseEnabled) {
                        cursor?.visibility = View.VISIBLE
                    }
                    // CSS fullscreen state is unknown once the native view is removed.
                    isCssFullscreen = false
                    // Re-synchronise fullscreen state with the WebView's UI.
                    syncFullscreenState()
                }
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?
            ): Boolean {
                return false
            }

            private fun hideCursor() {
                if (mouseEnabled) {
                    cursor?.visibility = View.GONE
                }
            }

            private fun showCursor() {
                if (mouseEnabled) {
                    cursor?.visibility = View.VISIBLE
                }
            }

            private fun syncFullscreenState() {
                // Wake the watch UI (if any) so the VidRift-side fullscreen flag
                // stays in sync with the native fullscreen state.
                webView.evaluateJavascript(
                    "if (window.__kenshinFullscreenState) window.__kenshinFullscreenState(!!document.fullscreenElement);",
                    null
                )
            }
        }
        chromeClient = client
        webView.webChromeClient = client
        webView.addJavascriptInterface(Bridge(), "KenshinView")
        // Enable Chrome remote debugging for diagnostics
        WebView.setWebContentsDebuggingEnabled(true)

        onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // Exit CSS fullscreen first if active.
                if (isCssFullscreen) {
                    webView.post { webView.evaluateJavascript("document.exitFullscreen?.()", null) }
                    return
                }
                if (customView != null) {
                    chromeClient?.onHideCustomView()
                } else if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                }
            }
        })

        webView.loadUrl("https://appassets.androidplatform.net/www/index.html")
    }

    /** Small ring cursor drawn above the WebView (always call on UI thread) */
    private fun ensureCursor() {
        if (cursor != null) return
        val size = (28 * resources.displayMetrics.density).toInt()
        val v = View(this)
        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.TRANSPARENT)
            setStroke((3 * resources.displayMetrics.density).toInt(), Color.WHITE)
        }
        v.background = bg
        v.layoutParams = FrameLayout.LayoutParams(size, size)
        v.visibility = View.GONE
        v.elevation = 9999f
        v.isClickable = false
        v.isFocusable = false
        root.addView(v)
        cursor = v
    }

    private fun setMouseEnabled(on: Boolean) {
        runOnUiThread {
            mouseEnabled = on
            isDragging = false
            ensureCursor()
            cursor?.visibility = if (on) View.VISIBLE else View.GONE
            if (on) {
                if (cursorX <= 0f || cursorY <= 0f) {
                    cursorX = webView.width / 2f
                    cursorY = webView.height / 2f
                }
                moveCursor(0f, 0f)
                webView.requestFocus()
            }
            notifyWeb()
        }
    }

    private fun notifyWeb() {
        val js = "window.__kenshinMouseState&&window.__kenshinMouseState($mouseEnabled);"
        webView.evaluateJavascript(js, null)
    }

    private fun moveCursor(dx: Float, dy: Float) {
        val v = cursor ?: return
        val w = webView.width.toFloat().coerceAtLeast(1f)
        val h = webView.height.toFloat().coerceAtLeast(1f)
        val oldX = cursorX
        val oldY = cursorY
        cursorX = max(0f, min(w, cursorX + dx))
        cursorY = max(0f, min(h, cursorY + dy))
        v.x = cursorX - v.width / 2f
        v.y = cursorY - v.height / 2f
        if (isDragging && (cursorX != oldX || cursorY != oldY)) {
            sendMoveEvent()
        }
    }

    /** Synthesize a tap at the cursor position and feed it to the WebView (reaches iframe players too) */
    private fun clickAtCursor() {
        val now = SystemClock.uptimeMillis()
        // Perform a very fast, clean tap sequence to avoid triggering "long press" or "drag" states
        // that might confuse the WebView or the embedded player.
        sendTouch(MotionEvent.ACTION_DOWN, now)
        sendTouch(MotionEvent.ACTION_UP, now + 10)
    }

    private fun sendTouch(action: Int, time: Long) {
        val ev = MotionEvent.obtain(time, time, action, cursorX, cursorY, 0)
        webView.dispatchTouchEvent(ev)
        ev.recycle()
    }

    private fun sendUp() {
        val t = SystemClock.uptimeMillis()
        sendTouch(MotionEvent.ACTION_UP, t)
    }

    private fun sendMoveEvent() {
        val t = SystemClock.uptimeMillis()
        sendTouch(MotionEvent.ACTION_MOVE, t)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (!mouseEnabled) return super.dispatchKeyEvent(event)
        val step = when {
            event.repeatCount > 2 -> 60f
            event.repeatCount > 0 -> 30f
            else -> 16f
        }
        when (event.keyCode) {
            // Move on every down event (including repeats) so holding D-pad feels smooth
            KeyEvent.KEYCODE_DPAD_UP -> { moveCursor(0f, -step); return true }
            KeyEvent.KEYCODE_DPAD_DOWN -> { moveCursor(0f, step); return true }
            KeyEvent.KEYCODE_DPAD_LEFT -> { moveCursor(-step, 0f); return true }
            KeyEvent.KEYCODE_DPAD_RIGHT -> { moveCursor(step, 0f); return true }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER, KeyEvent.KEYCODE_SPACE -> {
                if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                    isDragging = false
                    clickAtCursor()
                }
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                // Exit CSS fullscreen first if active, so one BACK press
                // leaves fullscreen instead of navigating away.
                if (isCssFullscreen) {
                    if (event.action == KeyEvent.ACTION_DOWN) {
                        webView.post { webView.evaluateJavascript("document.exitFullscreen?.()", null) }
                    }
                    return true
                }
                // If native fullscreen is active (e.g. iframe video went fullscreen),
                // exit it first instead of toggling the mouse.
                if (customView != null) {
                    chromeClient?.onHideCustomView()
                    return true
                }
                if (isDragging) {
                    sendUp()
                    isDragging = false
                }
                if (event.action == KeyEvent.ACTION_DOWN) setMouseEnabled(false)
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    inner class Bridge {
        @JavascriptInterface
        fun toggleMouse() = setMouseEnabled(!mouseEnabled)

        @JavascriptInterface
        fun setMouse(on: Boolean) = setMouseEnabled(on)

        @JavascriptInterface
        fun isMouse(): Boolean = mouseEnabled

        @JavascriptInterface
        fun fullscreenChanged(isFullscreen: Boolean) {
            isCssFullscreen = isFullscreen
        }

        @JavascriptInterface
        fun log(msg: String) {
            android.util.Log.e("VidRiftWEB", msg)
        }
    }
}
