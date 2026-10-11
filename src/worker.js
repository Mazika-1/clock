// clock.mazzen.dev — a configurable multi-player countdown clock, in the
// spirit of a chess timer but built for more than two players and more
// than one use case (games, debates, game-show "pass" rounds, speeches).
//
// Single static page, no backend/database — every setting and the running
// game state live in the browser (settings persist via localStorage so
// returning players don't have to re-enter them).

function pageHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>clock.mazzen.dev</title>
<style>
${styleCSS()}
</style>
</head>
<body>
  <div class="top-bar">
    <a class="brand" href="/">&#8987;</a>
    <div class="top-actions" id="topActions">
      <button class="tbtn" id="pauseBtn" title="Pause / Resume">Pause</button>
      <button class="tbtn" id="settingsBtn" title="Settings">Settings</button>
      <button class="tbtn" id="newGameBtn" title="New game">New game</button>
    </div>
  </div>

  <div id="setupScreen" class="screen">
    <div class="setup-wrap">
      <h1>Set up the clock</h1>

      <div class="field-row">
        <label>Players</label>
        <div class="stepper">
          <button type="button" id="playersMinus">&minus;</button>
          <span id="playersCount">2</span>
          <button type="button" id="playersPlus">+</button>
        </div>
      </div>

      <div class="field-row">
        <label>Time per player</label>
        <div class="time-input">
          <input type="number" id="baseMinutes" min="0" max="999" value="5"><span>m</span>
          <input type="number" id="baseSeconds" min="0" max="59" value="0"><span>s</span>
        </div>
      </div>

      <div class="field-row toggle-row">
        <label for="perPlayerToggle">Give players different starting times</label>
        <input type="checkbox" id="perPlayerToggle">
      </div>

      <div id="playersList" class="players-list"></div>

      <h2>Turn behavior</h2>

      <div class="field-row">
        <label>Turn order</label>
        <select id="turnMode">
          <option value="rotation">Rotation &mdash; tap your own clock to pass to the next player</option>
          <option value="free">Free &mdash; tap any player's clock to start their turn</option>
        </select>
      </div>

      <div class="field-row">
        <label>Bonus time added after each turn</label>
        <div class="time-input">
          <input type="number" id="incrementSeconds" min="0" max="999" value="0"><span>s</span>
        </div>
      </div>

      <div class="field-row">
        <label>When a clock hits 0:00</label>
        <select id="atZero">
          <option value="stop">Stop &amp; mark that player out of time</option>
          <option value="overtime">Keep counting up (overtime)</option>
        </select>
      </div>

      <div class="field-row toggle-row">
        <label for="lowTimeToggle">Flash the clock when time is low</label>
        <input type="checkbox" id="lowTimeToggle" checked>
      </div>
      <div class="field-row" id="lowTimeThresholdRow">
        <label>Low-time threshold</label>
        <div class="time-input">
          <input type="number" id="lowTimeThreshold" min="1" max="999" value="10"><span>s</span>
        </div>
      </div>

      <div class="field-row toggle-row">
        <label for="soundToggle">Sound (ticks + buzzer)</label>
        <input type="checkbox" id="soundToggle" checked>
      </div>

      <h2>Pass / gameshow button</h2>

      <div class="field-row toggle-row">
        <label for="passToggle">Enable a pass button</label>
        <input type="checkbox" id="passToggle">
      </div>
      <div id="passOptions" class="pass-options">
        <div class="field-row">
          <label>Button label</label>
          <input type="text" id="passLabel" maxlength="20" value="Pass">
        </div>
        <div class="field-row">
          <label>Countdown length</label>
          <div class="time-input">
            <input type="number" id="passDuration" min="1" max="120" value="5"><span>s</span>
          </div>
        </div>
        <div class="field-row">
          <label>Uses per player</label>
          <div class="stepper">
            <button type="button" id="passUsesMinus">&minus;</button>
            <span id="passUsesCount">0</span>
            <button type="button" id="passUsesPlus">+</button>
          </div>
          <span class="hint">0 = unlimited</span>
        </div>
      </div>

      <h2>Look</h2>
      <div class="field-row toggle-row" id="flipRow">
        <label for="flipToggle">Face-to-face layout (flip player 1, for two people across a table)</label>
        <input type="checkbox" id="flipToggle">
      </div>
      <div class="field-row toggle-row">
        <label for="lightToggle">Light theme</label>
        <input type="checkbox" id="lightToggle">
      </div>

      <button class="btn-start" id="startBtn">Start</button>
    </div>
  </div>

  <div id="gameScreen" class="screen hidden">
    <div id="panelsWrap" class="panels-wrap"></div>
  </div>

  <div id="passOverlay" class="pass-overlay">
    <div class="pass-overlay-inner">
      <div class="pass-overlay-label" id="passOverlayLabel"></div>
      <div class="pass-overlay-number" id="passOverlayNumber"></div>
    </div>
  </div>

  <script src="/app.js"></script>
</body>
</html>`;
}

function styleCSS() {
  return `
  :root {
    --bg: #0a0e17;
    --panel: #131a28;
    --border: rgba(56, 189, 248, 0.22);
    --muted: #94a3b8;
    --accent: #38bdf8;
    --accent2: #818cf8;
    --good: #10b981;
    --warn: #f59e0b;
    --danger: #f43f5e;
    --fg: #e2e8f0;
  }
  :root[data-theme="light"] {
    --bg: #f1f5f9;
    --panel: #ffffff;
    --border: rgba(56, 189, 248, 0.35);
    --muted: #64748b;
    --fg: #0f172a;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }
  .top-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 14px; border-bottom: 1px solid var(--border);
    height: 46px; position: relative; z-index: 20; background: var(--bg);
  }
  .brand { color: var(--accent); font-size: 1.2rem; text-decoration: none; }
  .top-actions { display: flex; gap: 8px; }
  .tbtn {
    background: var(--panel); border: 1px solid var(--border); color: var(--fg);
    padding: 7px 12px; border-radius: 8px; font-size: 0.82rem; cursor: pointer;
  }
  .tbtn:hover { border-color: var(--accent); }
  .tbtn.active { border-color: var(--warn); color: var(--warn); }

  .screen { height: calc(100% - 46px); overflow: auto; }
  .screen.hidden { display: none; }

  .setup-wrap { max-width: 560px; margin: 0 auto; padding: 20px 18px 60px; }
  h1 { font-size: 1.3rem; margin: 0 0 18px; }
  h2 { font-size: 0.95rem; color: var(--muted); margin: 26px 0 10px; border-top: 1px solid var(--border); padding-top: 18px; }
  .field-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
  .field-row label { font-size: 0.88rem; }
  .toggle-row input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--accent); cursor: pointer; }
  .hint { color: var(--muted); font-size: 0.72rem; }

  input[type="text"], input[type="number"], select {
    background: var(--bg); color: var(--fg); border: 1px solid var(--border);
    border-radius: 7px; padding: 7px 9px; font-size: 0.88rem;
  }
  input[type="number"] { width: 64px; }
  select { max-width: 260px; }

  .stepper { display: flex; align-items: center; gap: 10px; }
  .stepper button {
    width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border);
    background: var(--panel); color: var(--fg); font-size: 1.1rem; cursor: pointer; line-height: 1;
  }
  .stepper button:hover { border-color: var(--accent); }
  .stepper span { min-width: 20px; text-align: center; font-weight: 700; }

  .time-input { display: flex; align-items: center; gap: 4px; }
  .time-input span { color: var(--muted); font-size: 0.8rem; margin-right: 6px; }

  .players-list { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 6px; }
  .player-row { display: flex; align-items: center; gap: 8px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; }
  .player-row .swatch { width: 14px; height: 14px; border-radius: 50%; flex: none; }
  .player-row input[type="text"] { flex: 1; min-width: 0; }

  .pass-options { display: none; padding-left: 4px; border-left: 2px solid var(--border); margin-left: 2px; }
  .pass-options.open { display: block; }

  .btn-start {
    width: 100%; margin-top: 28px; padding: 16px; font-size: 1.1rem; font-weight: 700;
    border-radius: 14px; border: none; cursor: pointer;
    background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #071019;
  }

  .panels-wrap { height: 100%; display: grid; gap: 3px; background: var(--border); }

  .panel {
    position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--panel); cursor: pointer; overflow: hidden; padding: 10px;
  }
  .panel.inert { cursor: default; }
  .panel.active { background: color-mix(in srgb, var(--pcolor) 20%, var(--panel)); }
  .panel.active::after {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    box-shadow: inset 0 0 0 4px var(--pcolor); animation: pulse-glow 1.6s ease-in-out infinite;
  }
  @keyframes pulse-glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
  .panel.outoftime { background: color-mix(in srgb, var(--danger) 22%, var(--panel)); }
  .panel.outoftime .p-time { color: var(--danger); }
  .panel.lowtime .p-time { color: var(--danger); animation: low-flash 0.9s ease-in-out infinite; }
  @keyframes low-flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
  .panel.flipped { transform: rotate(180deg); }

  .p-name {
    font-size: 0.95rem; color: var(--muted); margin-bottom: 4px; max-width: 90%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;
    border: none; background: transparent; font-family: inherit;
  }
  .p-name:focus { outline: 1px dashed var(--pcolor); color: var(--fg); }
  .p-time {
    font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700;
    font-size: clamp(2rem, 9vw, 5rem); letter-spacing: 0.01em; line-height: 1;
  }
  .p-status { margin-top: 6px; font-size: 0.78rem; color: var(--danger); font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  .p-pass {
    margin-top: 10px; padding: 8px 16px; border-radius: 20px; border: 1px solid var(--pcolor);
    background: transparent; color: var(--fg); font-size: 0.8rem; cursor: pointer;
  }
  .p-pass:hover { background: color-mix(in srgb, var(--pcolor) 25%, transparent); }
  .p-pass:disabled { opacity: 0.35; cursor: not-allowed; }

  .pass-overlay {
    position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
    background: rgba(4, 6, 12, 0.62); z-index: 100; flex-direction: column;
  }
  .pass-overlay.open { display: flex; }
  .pass-overlay-inner { text-align: center; }
  .pass-overlay-label { font-size: 1.3rem; color: var(--fg); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; opacity: 0.85; }
  .pass-overlay-number {
    font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 800;
    font-size: clamp(6rem, 30vw, 14rem); color: var(--accent); line-height: 1;
    text-shadow: 0 0 40px rgba(56, 189, 248, 0.55);
  }

  @media (max-width: 640px) {
    .top-bar { padding: 6px 10px; }
    .tbtn { padding: 6px 9px; font-size: 0.74rem; }
  }
  `;
}

function appJS() {
  return `
(function () {
  "use strict";

  var PALETTE = ["#38bdf8", "#f97316", "#a855f7", "#10b981", "#f43f5e", "#f59e0b", "#818cf8", "#14b8a6"];
  var STORAGE_KEY = "clockmazzen.settings.v1";

  var setupScreen = document.getElementById("setupScreen");
  var gameScreen = document.getElementById("gameScreen");
  var panelsWrap = document.getElementById("panelsWrap");
  var pauseBtn = document.getElementById("pauseBtn");
  var settingsBtn = document.getElementById("settingsBtn");
  var newGameBtn = document.getElementById("newGameBtn");
  var passOverlay = document.getElementById("passOverlay");
  var passOverlayLabel = document.getElementById("passOverlayLabel");
  var passOverlayNumber = document.getElementById("passOverlayNumber");

  var playersMinus = document.getElementById("playersMinus");
  var playersPlus = document.getElementById("playersPlus");
  var playersCount = document.getElementById("playersCount");
  var baseMinutes = document.getElementById("baseMinutes");
  var baseSeconds = document.getElementById("baseSeconds");
  var perPlayerToggle = document.getElementById("perPlayerToggle");
  var playersList = document.getElementById("playersList");
  var turnMode = document.getElementById("turnMode");
  var incrementSeconds = document.getElementById("incrementSeconds");
  var atZero = document.getElementById("atZero");
  var lowTimeToggle = document.getElementById("lowTimeToggle");
  var lowTimeThresholdRow = document.getElementById("lowTimeThresholdRow");
  var lowTimeThreshold = document.getElementById("lowTimeThreshold");
  var soundToggle = document.getElementById("soundToggle");
  var passToggle = document.getElementById("passToggle");
  var passOptions = document.getElementById("passOptions");
  var passLabelInput = document.getElementById("passLabel");
  var passDuration = document.getElementById("passDuration");
  var passUsesMinus = document.getElementById("passUsesMinus");
  var passUsesPlus = document.getElementById("passUsesPlus");
  var passUsesCount = document.getElementById("passUsesCount");
  var flipRow = document.getElementById("flipRow");
  var flipToggle = document.getElementById("flipToggle");
  var lightToggle = document.getElementById("lightToggle");
  var startBtn = document.getElementById("startBtn");

  var MAX_PLAYERS = 10;

  var settings = {
    numPlayers: 2,
    baseMinutes: 5,
    baseSeconds: 0,
    perPlayerTimes: false,
    players: [],
    turnMode: "rotation",
    incrementSeconds: 0,
    atZero: "stop",
    lowTimeEnabled: true,
    lowTimeThreshold: 10,
    soundEnabled: true,
    passEnabled: false,
    passLabel: "Pass",
    passDuration: 5,
    passMaxUses: 0,
    flip: false,
    light: false,
  };

  function defaultPlayer(i) {
    return { name: "Player " + (i + 1), minutes: settings.baseMinutes, seconds: settings.baseSeconds, color: PALETTE[i % PALETTE.length] };
  }

  function ensurePlayersArray() {
    while (settings.players.length < settings.numPlayers) {
      settings.players.push(defaultPlayer(settings.players.length));
    }
    settings.players.length = settings.numPlayers;
    settings.players.forEach(function (p, i) { p.color = PALETTE[i % PALETTE.length]; if (!p.name) p.name = "Player " + (i + 1); });
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      Object.keys(settings).forEach(function (k) { if (saved[k] !== undefined) settings[k] = saved[k]; });
    } catch (_) {}
    ensurePlayersArray();
  }

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", settings.light ? "light" : "dark");
  }

  // ---------- setup screen wiring ----------

  function renderPlayersList() {
    playersList.innerHTML = "";
    if (!settings.perPlayerTimes) return;
    settings.players.forEach(function (p, i) {
      var row = document.createElement("div");
      row.className = "player-row";
      row.innerHTML =
        '<span class="swatch"></span>' +
        '<input type="text" maxlength="24" class="pname">' +
        '<div class="time-input"><input type="number" min="0" max="999" class="pmin"><span>m</span>' +
        '<input type="number" min="0" max="59" class="psec"><span>s</span></div>';
      row.querySelector(".swatch").style.background = p.color;
      var nameInput = row.querySelector(".pname");
      nameInput.value = p.name;
      nameInput.addEventListener("input", function () { p.name = nameInput.value; });
      var minInput = row.querySelector(".pmin");
      minInput.value = p.minutes;
      minInput.addEventListener("input", function () { p.minutes = Math.max(0, Number(minInput.value) || 0); });
      var secInput = row.querySelector(".psec");
      secInput.value = p.seconds;
      secInput.addEventListener("input", function () { p.seconds = Math.max(0, Math.min(59, Number(secInput.value) || 0)); });
      playersList.appendChild(row);
    });
  }

  function syncSetupUI() {
    playersCount.textContent = settings.numPlayers;
    baseMinutes.value = settings.baseMinutes;
    baseSeconds.value = settings.baseSeconds;
    perPlayerToggle.checked = settings.perPlayerTimes;
    playersList.style.display = settings.perPlayerTimes ? "flex" : "none";
    turnMode.value = settings.turnMode;
    incrementSeconds.value = settings.incrementSeconds;
    atZero.value = settings.atZero;
    lowTimeToggle.checked = settings.lowTimeEnabled;
    lowTimeThresholdRow.style.display = settings.lowTimeEnabled ? "flex" : "none";
    lowTimeThreshold.value = settings.lowTimeThreshold;
    soundToggle.checked = settings.soundEnabled;
    passToggle.checked = settings.passEnabled;
    passOptions.className = "pass-options" + (settings.passEnabled ? " open" : "");
    passLabelInput.value = settings.passLabel;
    passDuration.value = settings.passDuration;
    passUsesCount.textContent = settings.passMaxUses;
    flipRow.style.display = settings.numPlayers === 2 ? "flex" : "none";
    flipToggle.checked = settings.flip;
    lightToggle.checked = settings.light;
    renderPlayersList();
  }

  playersMinus.addEventListener("click", function () {
    if (settings.numPlayers <= 1) return;
    settings.numPlayers--;
    ensurePlayersArray();
    syncSetupUI();
  });
  playersPlus.addEventListener("click", function () {
    if (settings.numPlayers >= MAX_PLAYERS) return;
    settings.numPlayers++;
    ensurePlayersArray();
    syncSetupUI();
  });
  baseMinutes.addEventListener("input", function () {
    settings.baseMinutes = Math.max(0, Number(baseMinutes.value) || 0);
    if (!settings.perPlayerTimes) settings.players.forEach(function (p) { p.minutes = settings.baseMinutes; });
  });
  baseSeconds.addEventListener("input", function () {
    settings.baseSeconds = Math.max(0, Math.min(59, Number(baseSeconds.value) || 0));
    if (!settings.perPlayerTimes) settings.players.forEach(function (p) { p.seconds = settings.baseSeconds; });
  });
  perPlayerToggle.addEventListener("change", function () {
    settings.perPlayerTimes = perPlayerToggle.checked;
    if (!settings.perPlayerTimes) {
      settings.players.forEach(function (p) { p.minutes = settings.baseMinutes; p.seconds = settings.baseSeconds; });
    }
    syncSetupUI();
  });
  turnMode.addEventListener("change", function () { settings.turnMode = turnMode.value; });
  incrementSeconds.addEventListener("input", function () { settings.incrementSeconds = Math.max(0, Number(incrementSeconds.value) || 0); });
  atZero.addEventListener("change", function () { settings.atZero = atZero.value; });
  lowTimeToggle.addEventListener("change", function () { settings.lowTimeEnabled = lowTimeToggle.checked; syncSetupUI(); });
  lowTimeThreshold.addEventListener("input", function () { settings.lowTimeThreshold = Math.max(1, Number(lowTimeThreshold.value) || 1); });
  soundToggle.addEventListener("change", function () { settings.soundEnabled = soundToggle.checked; });
  passToggle.addEventListener("change", function () { settings.passEnabled = passToggle.checked; syncSetupUI(); });
  passLabelInput.addEventListener("input", function () { settings.passLabel = passLabelInput.value || "Pass"; });
  passDuration.addEventListener("input", function () { settings.passDuration = Math.max(1, Number(passDuration.value) || 1); });
  passUsesMinus.addEventListener("click", function () { settings.passMaxUses = Math.max(0, settings.passMaxUses - 1); passUsesCount.textContent = settings.passMaxUses; });
  passUsesPlus.addEventListener("click", function () { settings.passMaxUses = Math.min(99, settings.passMaxUses + 1); passUsesCount.textContent = settings.passMaxUses; });
  flipToggle.addEventListener("change", function () { settings.flip = flipToggle.checked; });
  lightToggle.addEventListener("change", function () { settings.light = lightToggle.checked; applyTheme(); });

  // ---------- game state ----------

  var game = null; // built on start

  function buildGame() {
    ensurePlayersArray();
    var n = settings.numPlayers;
    var remaining = settings.players.map(function (p) { return (p.minutes * 60 + p.seconds) * 1000; });
    game = {
      n: n,
      names: settings.players.map(function (p) { return p.name; }),
      colors: settings.players.map(function (p) { return p.color; }),
      remainingMs: remaining,
      outOfTime: remaining.map(function (ms) { return ms <= 0; }),
      passUsesLeft: remaining.map(function () { return settings.passMaxUses; }),
      active: -1,
      running: false,
      paused: false,
      lastTs: null,
      rafId: null,
    };
  }

  function fmtTime(ms) {
    var neg = ms < 0;
    var totalSec = Math.ceil(Math.abs(ms) / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var out = h > 0
      ? h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0")
      : m + ":" + String(s).padStart(2, "0");
    return (neg ? "-" : "") + out;
  }

  // ---------- sound ----------

  var audioCtx = null;
  function beep(freq, durMs, vol) {
    if (!settings.soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = vol || 0.08;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durMs / 1000);
      osc.stop(audioCtx.currentTime + durMs / 1000);
    } catch (_) {}
  }

  // ---------- render ----------

  function gridStyleFor(n) {
    if (n === 1) return "grid-template-columns: 1fr; grid-template-rows: 1fr;";
    if (n === 2) return "grid-template-columns: 1fr; grid-template-rows: 1fr 1fr;";
    if (n <= 4) return "grid-template-columns: 1fr 1fr; grid-template-rows: repeat(" + Math.ceil(n / 2) + ", 1fr);";
    return "grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(" + Math.ceil(n / 3) + ", 1fr);";
  }

  function renderPanels() {
    panelsWrap.style.cssText = gridStyleFor(game.n);
    panelsWrap.innerHTML = "";
    for (var i = 0; i < game.n; i++) {
      (function (i) {
        var panel = document.createElement("div");
        panel.className = "panel";
        panel.style.setProperty("--pcolor", game.colors[i]);
        panel.dataset.idx = i;
        if (settings.flip && game.n === 2 && i === 0) panel.classList.add("flipped");

        var nameEl = document.createElement("input");
        nameEl.className = "p-name";
        nameEl.value = game.names[i];
        nameEl.addEventListener("click", function (e) { e.stopPropagation(); });
        nameEl.addEventListener("input", function () { game.names[i] = nameEl.value; });

        var timeEl = document.createElement("div");
        timeEl.className = "p-time";

        var statusEl = document.createElement("div");
        statusEl.className = "p-status";

        panel.appendChild(nameEl);
        panel.appendChild(timeEl);
        panel.appendChild(statusEl);

        if (settings.passEnabled) {
          var passBtn = document.createElement("button");
          passBtn.className = "p-pass";
          passBtn.type = "button";
          passBtn.textContent = settings.passLabel;
          passBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            triggerPass(i);
          });
          panel.appendChild(passBtn);
          panel._passBtn = passBtn;
        }

        panel.addEventListener("click", function () { handlePanelTap(i); });

        panel._timeEl = timeEl;
        panel._statusEl = statusEl;
        panelsWrap.appendChild(panel);
      })(i);
    }
    updatePanels();
  }

  function updatePanels() {
    var panels = panelsWrap.children;
    for (var i = 0; i < game.n; i++) {
      var panel = panels[i];
      if (!panel) continue;
      panel._timeEl.textContent = fmtTime(game.remainingMs[i]);
      panel.classList.toggle("active", game.active === i && game.running);
      panel.classList.toggle("outoftime", game.outOfTime[i]);
      panel.classList.toggle("inert", !panelIsTappable(i));
      var low = settings.lowTimeEnabled && !game.outOfTime[i] && game.remainingMs[i] > 0 && game.remainingMs[i] <= settings.lowTimeThreshold * 1000;
      panel.classList.toggle("lowtime", low);
      panel._statusEl.textContent = game.outOfTime[i] ? "Time's up" : "";
      if (panel._passBtn) {
        var usesLeft = game.passUsesLeft[i];
        var allowed = settings.passMaxUses === 0 || usesLeft > 0;
        panel._passBtn.disabled = !(game.active === i && game.running && !game.paused && allowed);
        panel._passBtn.textContent = settings.passLabel + (settings.passMaxUses > 0 ? " (" + usesLeft + ")" : "");
      }
    }
  }

  function panelIsTappable(i) {
    if (!game.running || game.paused) return false;
    if (game.outOfTime[i]) return false;
    if (settings.turnMode === "free") return true;
    return game.active === i;
  }

  function handlePanelTap(i) {
    if (!panelIsTappable(i)) return;
    var prevActive = game.active;
    if (settings.turnMode === "free") {
      if (prevActive !== -1 && prevActive !== i) applyIncrement(prevActive);
      game.active = i;
    } else {
      applyIncrement(i);
      game.active = nextPlayerIndex(i);
    }
    beep(880, 70, 0.06);
    updatePanels();
  }

  function applyIncrement(i) {
    if (settings.incrementSeconds > 0 && !game.outOfTime[i]) {
      game.remainingMs[i] += settings.incrementSeconds * 1000;
    }
  }

  function nextPlayerIndex(from) {
    var i = from;
    for (var tries = 0; tries < game.n; tries++) {
      i = (i + 1) % game.n;
      if (!game.outOfTime[i]) return i;
    }
    return from;
  }

  // ---------- ticking ----------

  function tick(now) {
    if (game.running && !game.paused && game.active !== -1) {
      var dt = game.lastTs == null ? 0 : now - game.lastTs;
      game.lastTs = now;
      var i = game.active;
      if (!game.outOfTime[i]) {
        var wasAboveWarn = game.remainingMs[i] > settings.lowTimeThreshold * 1000;
        game.remainingMs[i] -= dt;
        if (game.remainingMs[i] <= 0) {
          if (settings.atZero === "stop") {
            game.remainingMs[i] = 0;
            game.outOfTime[i] = true;
            beep(160, 500, 0.12);
          }
        } else if (settings.lowTimeEnabled && wasAboveWarn && game.remainingMs[i] <= settings.lowTimeThreshold * 1000) {
          beep(660, 120, 0.07);
        }
        updatePanels();
      }
    } else {
      game.lastTs = now;
    }
    game.rafId = requestAnimationFrame(tick);
  }

  // ---------- pass overlay ----------

  var passRunning = false;
  function triggerPass(i) {
    if (passRunning) return;
    if (game.active !== i || !game.running || game.paused) return;
    if (settings.passMaxUses > 0 && game.passUsesLeft[i] <= 0) return;
    if (settings.passMaxUses > 0) game.passUsesLeft[i]--;
    passRunning = true;
    updatePanels();
    passOverlayLabel.textContent = settings.passLabel;
    passOverlay.classList.add("open");
    var remaining = Math.ceil(settings.passDuration);
    passOverlayNumber.textContent = remaining;
    beep(500, 80, 0.05);
    var timer = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        passOverlay.classList.remove("open");
        passRunning = false;
        updatePanels();
        return;
      }
      passOverlayNumber.textContent = remaining;
      beep(500, 80, 0.05);
    }, 1000);
  }

  // ---------- pause / new game / settings ----------

  function setPauseUI() {
    pauseBtn.textContent = game && game.paused ? "Resume" : "Pause";
    pauseBtn.classList.toggle("active", !!(game && game.paused));
  }

  pauseBtn.addEventListener("click", function () {
    if (!game || !game.running) return;
    game.paused = !game.paused;
    setPauseUI();
    updatePanels();
  });

  settingsBtn.addEventListener("click", function () {
    if (game) { game.paused = true; setPauseUI(); }
    showSetup();
  });

  newGameBtn.addEventListener("click", function () {
    showSetup();
  });

  startBtn.addEventListener("click", function () {
    saveSettings();
    ensurePlayersArray();
    buildGame();
    game.active = 0;
    game.running = true;
    game.paused = false;
    showGame();
    renderPanels();
    setPauseUI();
    if (game.rafId) cancelAnimationFrame(game.rafId);
    game.lastTs = null;
    game.rafId = requestAnimationFrame(tick);
  });

  function showSetup() {
    if (game && game.rafId) { cancelAnimationFrame(game.rafId); game.rafId = null; }
    syncSetupUI();
    setupScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
  }
  function showGame() {
    setupScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
  }

  // ---------- boot ----------

  loadSettings();
  applyTheme();
  syncSetupUI();
})();
`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "/index.html") {
      return new Response(pageHTML(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (path === "/app.js") {
      return new Response(appJS(), { headers: { "content-type": "application/javascript; charset=utf-8" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
