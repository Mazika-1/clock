// Runs before the clock in the Android app. Routes the web APIs the clock
// uses (and that Android's WebView lacks) to the native ClockApp bridge.
(function () {
  var A = window.ClockApp;
  if (!A) return;

  // voice announcer
  window.SpeechSynthesisUtterance = function (text) { this.text = String(text || ""); this.rate = 1; this.volume = 1; this.pitch = 1; };
  window.speechSynthesis = {
    speak: function (u) { try { A.speak(u.text, u.rate || 1); } catch (_) {} },
    cancel: function () { try { A.stopSpeaking(); } catch (_) {} },
    getVoices: function () { return []; },
  };

  // haptics
  navigator.vibrate = function (p) { try { A.vibrate(JSON.stringify(Array.isArray(p) ? p : [p])); } catch (_) {} return true; };

  // keep the screen on
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: {
      request: function () {
        A.keepAwake(true);
        var listeners = [];
        return Promise.resolve({
          released: false,
          addEventListener: function (t, f) { if (t === "release") listeners.push(f); },
          release: function () { this.released = true; A.keepAwake(false); listeners.forEach(function (f) { try { f(); } catch (_) {} }); return Promise.resolve(); },
        });
      },
    },
  });

  // fullscreen hides the status and navigation bars
  var fs = false;
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: function () { return fs ? document.documentElement : null; } });
  window.__clockAppFullscreen = function (on) {
    if (fs === !!on) return;
    fs = !!on;
    document.dispatchEvent(new Event("fullscreenchange"));
  };
  Element.prototype.requestFullscreen = function () { A.setFullscreen(true); return Promise.resolve(); };
  document.exitFullscreen = function () { A.setFullscreen(false); return Promise.resolve(); };
})();
