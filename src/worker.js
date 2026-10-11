// clock.mazzen.dev — a beautiful, configurable multi-player game clock.
//
// Chess clock, board-game timer, debate timer, game-show "pass" clock and
// speech timer in one page, for 1–10 players. Everything runs in the browser:
// settings, custom presets and the game in progress persist in localStorage,
// so a refresh never loses a game. No backend, no database.
//
// Routes:
//   /                      the app (HTML + CSS)
//   /app.js                client code (clientApp below, serialized)
//   /manifest.webmanifest  PWA manifest (installable, full-screen)
//   /icon.svg              app icon
//   /sw.js                 service worker — the clock keeps working offline

function pageHTML() {
  return `<!DOCTYPE html>
<html lang="en" data-theme="midnight" data-font="mono">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#07090f">
<meta name="description" content="A gorgeous multi-player game clock: chess timer, board-game timer, debate timer and game-show pass clock for 1 to 10 players.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&family=Space+Grotesk:wght@500;700&family=Orbitron:wght@600;800&family=Fraunces:opsz,wght@9..144,600;9..144,800&display=swap">
<title>Clock · mazzen.dev</title>
<style>
${styleCSS()}
</style>
</head>
<body>

<!-- ======================= SETUP ======================= -->
<main id="setup" class="setup">
  <header class="s-head">
    <a class="logo" href="/" aria-label="clock.mazzen.dev">
      <span class="logo-mark">${ICON_MARK}</span>
      <span class="logo-text">clock<em>.mazzen.dev</em></span>
    </a>
    <div class="s-head-actions">
      <button class="icon-btn" id="themeQuick" type="button" title="Next theme" aria-label="Next theme">${svg("palette")}</button>
      <button class="icon-btn" id="helpBtn" type="button" title="Keyboard shortcuts" aria-label="Keyboard shortcuts">${svg("keyboard")}</button>
    </div>
  </header>

  <section class="hero">
    <div class="hero-copy">
      <h1>Every clock<br><span class="grad">for every game.</span></h1>
      <p>Chess, board games, debates, game shows and speeches, for one to ten players. Pick a preset or build your own.</p>
    </div>
    <div class="preview" id="preview" aria-hidden="true"></div>
  </section>

  <div id="resumeCard" class="resume-card hidden">
    <div class="resume-pulse"></div>
    <div class="resume-text">
      <strong>Game in progress</strong>
      <span id="resumeInfo"></span>
    </div>
    <div class="resume-actions">
      <button class="btn ghost" id="discardBtn" type="button">Discard</button>
      <button class="btn primary" id="resumeBtn" type="button">${svg("play")} Resume</button>
    </div>
  </div>

  <div class="cards">

    <section class="card card-wide">
      <div class="card-head">
        <h2>${svg("bolt")} Presets</h2>
        <button class="link-btn" id="savePresetBtn" type="button">${svg("plus")} Save current</button>
      </div>
      <div class="presets" id="presets"></div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>${svg("users")} Players</h2>
        <div class="stepper" data-step="numPlayers" data-min="1" data-max="10">
          <button type="button" data-d="-1" aria-label="Fewer players">${svg("minus")}</button>
          <output></output>
          <button type="button" data-d="1" aria-label="More players">${svg("plus")}</button>
        </div>
      </div>
      <div id="playerList" class="player-list"></div>
      <div class="row-actions">
        <button class="chip-btn" id="shuffleBtn" type="button">${svg("shuffle")} Shuffle seats</button>
        <button class="chip-btn" id="resetNamesBtn" type="button">${svg("undo")} Reset names</button>
      </div>
      <label class="field toggle">
        <span><b>Handicap</b><small>Give each player their own starting time</small></span>
        <input type="checkbox" class="switch" data-bind="perPlayerTimes">
      </label>
    </section>

    <section class="card">
      <h2>${svg("clock")} Time control</h2>
      <div class="time-big" data-show="!perPlayerTimes&amp;timing!=countup">
        <label><input type="number" inputmode="numeric" min="0" max="999" data-bind="baseMinutes" aria-label="Minutes"><span>min</span></label>
        <b>:</b>
        <label><input type="number" inputmode="numeric" min="0" max="59" data-bind="baseSeconds" aria-label="Seconds"><span>sec</span></label>
      </div>
      <div class="quick-times" data-show="!perPlayerTimes&amp;timing!=countup" id="quickTimes"></div>
      <div class="seg" data-bind="timing" role="radiogroup" aria-label="Timing mode">
        <button type="button" data-v="none">Sudden death</button>
        <button type="button" data-v="increment">Increment</button>
        <button type="button" data-v="delay">Delay</button>
        <button type="button" data-v="bronstein">Bronstein</button>
        <button type="button" data-v="hourglass">Hourglass</button>
        <button type="button" data-v="byoyomi">Byo-yomi</button>
        <button type="button" data-v="countup">Stopwatch</button>
      </div>
      <p class="explain" id="timingExplain"></p>
      <label class="field" data-show="timing=increment|delay|bronstein">
        <span><b id="incLabel">Increment</b><small>seconds per move</small></span>
        <span class="num"><input type="number" inputmode="numeric" min="0" max="600" data-bind="increment"><i>s</i></span>
      </label>
      <div data-show="timing=byoyomi">
        <div class="field">
          <span><b>Periods</b><small>Extra periods after main time runs out</small></span>
          <div class="stepper sm" data-step="byoPeriods" data-min="1" data-max="20">
            <button type="button" data-d="-1" aria-label="Fewer">${svg("minus")}</button><output></output><button type="button" data-d="1" aria-label="More">${svg("plus")}</button>
          </div>
        </div>
        <label class="field">
          <span><b>Period length</b><small>Seconds per move once in overtime</small></span>
          <span class="num"><input type="number" inputmode="numeric" min="1" max="600" data-bind="byoSeconds"><i>s</i></span>
        </label>
      </div>
    </section>

    <section class="card">
      <h2>${svg("route")} Turns</h2>
      <div class="field col">
        <span><b>Turn order</b></span>
        <div class="seg" data-bind="turnMode">
          <button type="button" data-v="clockwise">${svg("cw")} In order</button>
          <button type="button" data-v="counter">${svg("ccw")} Reverse</button>
          <button type="button" data-v="snake">${svg("snake")} Snake</button>
          <button type="button" data-v="free">${svg("hand")} Free</button>
        </div>
        <small class="explain" id="turnExplain"></small>
      </div>
      <div class="field">
        <span><b>Who starts</b></span>
        <div class="seg sm" data-bind="startPlayer">
          <button type="button" data-v="first">Player 1</button>
          <button type="button" data-v="random">${svg("dice")} Random</button>
        </div>
      </div>
      <label class="field toggle" data-show="turnMode!=free">
        <span><b>Tap anywhere</b><small>Any tap ends the current turn. Good for one phone in the middle of the table.</small></span>
        <input type="checkbox" class="switch" data-bind="tapAnywhere">
      </label>
      <div class="field" data-show="timing!=countup">
        <span><b>At 0:00</b></span>
        <div class="seg sm" data-bind="atZero">
          <button type="button" data-v="stop">Player is out</button>
          <button type="button" data-v="overtime">Overtime</button>
        </div>
      </div>
      <label class="field toggle">
        <span><b>Move time limit</b><small>A shot clock for each turn</small></span>
        <input type="checkbox" class="switch" data-bind="moveLimitEnabled">
      </label>
      <div class="sub" data-show="moveLimitEnabled">
        <label class="field">
          <span><b>Limit</b></span>
          <span class="num"><input type="number" inputmode="numeric" min="1" max="3600" data-bind="moveLimit"><i>s</i></span>
        </label>
        <div class="field">
          <span><b>When it's hit</b></span>
          <div class="seg sm" data-bind="moveLimitAction">
            <button type="button" data-v="warn">Warn</button>
            <button type="button" data-v="pass">Skip turn</button>
            <button type="button" data-v="out">Out</button>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>${svg("mic")} Game-show pass</h2>
      <label class="field toggle">
        <span><b>Pass button</b><small>Shows a big countdown, e.g. "Pass! 5… 4… 3…"</small></span>
        <input type="checkbox" class="switch" data-bind="passEnabled">
      </label>
      <div class="sub" data-show="passEnabled">
        <label class="field">
          <span><b>Label</b></span>
          <input type="text" maxlength="20" data-bind="passLabel" class="text-in">
        </label>
        <label class="field">
          <span><b>Countdown</b></span>
          <span class="num"><input type="number" inputmode="numeric" min="1" max="120" data-bind="passDuration"><i>s</i></span>
        </label>
        <div class="field">
          <span><b>Uses per player</b><small>0 = unlimited</small></span>
          <div class="stepper sm" data-step="passMaxUses" data-min="0" data-max="99">
            <button type="button" data-d="-1" aria-label="Fewer">${svg("minus")}</button><output></output><button type="button" data-d="1" aria-label="More">${svg("plus")}</button>
          </div>
        </div>
        <label class="field toggle">
          <span><b>Freeze clocks during countdown</b></span>
          <input type="checkbox" class="switch" data-bind="passPauses">
        </label>
        <label class="field toggle">
          <span><b>Pass ends the turn</b></span>
          <input type="checkbox" class="switch" data-bind="passEndsTurn">
        </label>
      </div>
    </section>

    <section class="card">
      <h2>${svg("bell")} Alerts</h2>
      <label class="field toggle" data-show="timing!=countup">
        <span><b>Low-time warning</b><small>Clock pulses red</small></span>
        <input type="checkbox" class="switch" data-bind="lowTimeEnabled">
      </label>
      <label class="field sub" data-show="lowTimeEnabled&amp;timing!=countup">
        <span><b>Warn below</b></span>
        <span class="num"><input type="number" inputmode="numeric" min="1" max="600" data-bind="lowTimeThreshold"><i>s</i></span>
      </label>
      <label class="field toggle">
        <span><b>Tenths of a second</b><small>Under 20 seconds</small></span>
        <input type="checkbox" class="switch" data-bind="showTenths">
      </label>
      <label class="field toggle">
        <span><b>Sound</b></span>
        <input type="checkbox" class="switch" data-bind="soundEnabled">
      </label>
      <div class="sub" data-show="soundEnabled">
        <div class="field col">
          <div class="seg" data-bind="soundPack">
            <button type="button" data-v="classic">Classic</button>
            <button type="button" data-v="soft">Soft</button>
            <button type="button" data-v="arcade">Arcade</button>
            <button type="button" data-v="wood">Wood</button>
          </div>
        </div>
        <div class="field">
          <span><b>Volume</b></span>
          <span class="range-wrap"><input type="range" min="0" max="100" data-bind="volume" aria-label="Volume"><button class="chip-btn" id="testSound" type="button">${svg("volume")} Test</button></span>
        </div>
        <label class="field toggle">
          <span><b>Countdown ticks</b><small>Tick every second in the warning zone</small></span>
          <input type="checkbox" class="switch" data-bind="tickLast">
        </label>
      </div>
      <label class="field toggle">
        <span><b>Voice announcer</b><small>Reads out whose turn it is and time warnings</small></span>
        <input type="checkbox" class="switch" data-bind="voiceEnabled">
      </label>
      <label class="field toggle">
        <span><b>Haptics</b><small>Vibrates on supported phones</small></span>
        <input type="checkbox" class="switch" data-bind="vibrate">
      </label>
    </section>

    <section class="card card-wide">
      <h2>${svg("sparkle")} Look &amp; feel</h2>
      <div class="field col">
        <span><b>Theme</b></span>
        <div class="themes" id="themes"></div>
      </div>
      <div class="field col">
        <span><b>Clock font</b></span>
        <div class="fonts" id="fonts"></div>
      </div>
      <div class="look-grid">
        <div class="field col">
          <span><b>Layout</b></span>
          <div class="seg" data-bind="layout">
            <button type="button" data-v="auto">Auto</button>
            <button type="button" data-v="table">${svg("table")} Table</button>
            <button type="button" data-v="stack">Stack</button>
          </div>
          <small class="explain" id="layoutExplain"></small>
        </div>
        <div class="field col">
          <span><b>Time remaining</b></span>
          <div class="seg" data-bind="progress">
            <button type="button" data-v="fill">Liquid</button>
            <button type="button" data-v="bar">Bar</button>
            <button type="button" data-v="ring">Ring</button>
            <button type="button" data-v="none">None</button>
          </div>
        </div>
        <div class="field col">
          <span><b>Controls</b></span>
          <div class="seg" data-bind="dock">
            <button type="button" data-v="auto">Auto</button>
            <button type="button" data-v="bottom">Bottom</button>
            <button type="button" data-v="center">Center</button>
          </div>
        </div>
      </div>
      <label class="field toggle">
        <span><b>Keep screen awake</b><small>While a game is running</small></span>
        <input type="checkbox" class="switch" data-bind="keepAwake">
      </label>
      <label class="field toggle">
        <span><b>Turn stats on clocks</b><small>Move count and current turn time</small></span>
        <input type="checkbox" class="switch" data-bind="showMoves">
      </label>
    </section>

    <section class="card card-wide share-card">
      <div>
        <h2>${svg("link")} Share this setup</h2>
        <p class="explain">Send a link with these exact settings so friends can open the same clock.</p>
      </div>
      <div class="row-actions">
        <button class="chip-btn" id="shareBtn" type="button">${svg("link")} Copy link</button>
        <button class="chip-btn danger" id="resetBtn" type="button">${svg("trash")} Reset everything</button>
      </div>
    </section>
  </div>

  <footer class="start-bar">
    <div class="start-summary" id="summary"></div>
    <button class="btn-start" id="startBtn" type="button">
      <span>Start</span>${svg("arrow")}
    </button>
  </footer>
</main>

<!-- ======================= GAME ======================= -->
<main id="game" class="game hidden">
  <div id="board" class="board"></div>

  <div id="dock" class="dock">
    <button class="dock-btn" id="pauseBtn" type="button" aria-label="Pause">${svg("pause")}</button>
    <button class="dock-btn" id="undoBtn" type="button" aria-label="Undo last turn">${svg("undo")}</button>
    <div class="dock-info" id="dockInfo"><b id="dockRound"></b><span id="dockElapsed"></span></div>
    <button class="dock-btn" id="muteBtn" type="button" aria-label="Mute">${svg("volume")}</button>
    <button class="dock-btn" id="fsBtn" type="button" aria-label="Fullscreen">${svg("expand")}</button>
    <button class="dock-btn" id="menuBtn" type="button" aria-label="Menu">${svg("menu")}</button>
  </div>

  <div id="pausedOverlay" class="paused-overlay hidden">
    <div class="paused-inner">
      <div class="paused-label">Paused</div>
      <button class="btn primary big" id="resumeGameBtn" type="button">${svg("play")} Resume</button>
      <div class="paused-actions">
        <button class="chip-btn" id="pRestart" type="button">${svg("restart")} Restart</button>
        <button class="chip-btn" id="pSettings" type="button">${svg("sliders")} Settings</button>
        <button class="chip-btn" id="pEnd" type="button">${svg("flag")} End &amp; results</button>
      </div>
    </div>
  </div>
</main>

<div id="passOverlay" class="pass-overlay" aria-live="assertive">
  <div class="pass-ring">
    <svg viewBox="0 0 200 200"><circle class="pr-track" cx="100" cy="100" r="90"/><circle class="pr-bar" id="passRingBar" cx="100" cy="100" r="90"/></svg>
    <div class="pass-center">
      <div class="pass-label" id="passOverlayLabel"></div>
      <div class="pass-number" id="passOverlayNumber"></div>
      <div class="pass-who" id="passOverlayWho"></div>
    </div>
  </div>
</div>

<div id="modal" class="modal hidden" role="dialog" aria-modal="true">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-card" id="modalCard"></div>
</div>

<div id="toasts" class="toasts" aria-live="polite"></div>
<canvas id="confetti" class="confetti"></canvas>

<script src="/app.js" defer></script>
</body>
</html>`;
}

// ---------- icons (inline SVG, stroke = currentColor) ----------

const ICONS = {
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4M7 16.5h10"/>',
  play: '<path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  cw: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  ccw: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  snake: '<path d="M4 6h12a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h12"/><path d="m17 15 3 3-3 3"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  mute: '<path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="m22 9-6 6M16 9l6 6"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
  table: '<rect x="4" y="7" width="16" height="10" rx="3"/><path d="M12 3v2M12 19v2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  shrink: '<path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  restart: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

function svg(name) {
  return '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
}

const ICON_MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c9cff"/><stop offset="1" stop-color="#e879f9"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lg)"/><circle cx="16" cy="17" r="8.5" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M16 12.5V17l3 2" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/><rect x="13" y="4.5" width="6" height="2.6" rx="1.3" fill="#fff"/></svg>';

function styleCSS() {
  return `
/* ---------- themes ---------- */
:root, [data-theme="midnight"] {
  --bg: #07090f; --bg-glow-1: rgba(124,156,255,.16); --bg-glow-2: rgba(232,121,249,.10);
  --surface: rgba(255,255,255,.035); --surface-2: rgba(255,255,255,.07); --surface-solid: #0e1220;
  --line: rgba(255,255,255,.08); --line-2: rgba(255,255,255,.16);
  --fg: #eef1f8; --muted: #8b93a7; --faint: #5a6276;
  --accent: #7c9cff; --accent-2: #e879f9; --on-accent: #0a0d18;
  --danger: #ff5c7a; --warn: #ffb547; --ok: #3ee0a1;
  --panel: #0d111c; --board: #05070c; --glow: .55; --mono-player: 0;
  color-scheme: dark;
}
[data-theme="aurora"] {
  --bg: #04110f; --bg-glow-1: rgba(45,212,191,.22); --bg-glow-2: rgba(129,140,248,.18);
  --surface: rgba(255,255,255,.04); --surface-2: rgba(255,255,255,.08); --surface-solid: #0a1c1a;
  --line: rgba(160,255,230,.10); --line-2: rgba(160,255,230,.22);
  --fg: #e9fffa; --muted: #86a8a0; --faint: #557069;
  --accent: #2dd4bf; --accent-2: #818cf8; --on-accent: #021412;
  --panel: #081614; --board: #020a09; --glow: .7;
  color-scheme: dark;
}
[data-theme="neon"] {
  --bg: #07000d; --bg-glow-1: rgba(255,0,170,.22); --bg-glow-2: rgba(0,240,255,.18);
  --surface: rgba(255,255,255,.035); --surface-2: rgba(255,255,255,.08); --surface-solid: #12051c;
  --line: rgba(255,80,220,.14); --line-2: rgba(255,80,220,.3);
  --fg: #fff0fd; --muted: #a58bb0; --faint: #6c5576;
  --accent: #ff3df2; --accent-2: #00f0ff; --on-accent: #12001a;
  --panel: #0e0318; --board: #040008; --glow: 1;
  color-scheme: dark;
}
[data-theme="sunset"] {
  --bg: #140a0d; --bg-glow-1: rgba(255,138,91,.22); --bg-glow-2: rgba(255,82,136,.16);
  --surface: rgba(255,255,255,.04); --surface-2: rgba(255,255,255,.08); --surface-solid: #221117;
  --line: rgba(255,190,160,.12); --line-2: rgba(255,190,160,.24);
  --fg: #fff4ee; --muted: #b8968c; --faint: #7d5f58;
  --accent: #ff8a5b; --accent-2: #ff5288; --on-accent: #1f0a05;
  --panel: #1a0d12; --board: #0b0507; --glow: .65;
  color-scheme: dark;
}
[data-theme="paper"] {
  --bg: #f3efe6; --bg-glow-1: rgba(124,156,255,.18); --bg-glow-2: rgba(255,138,91,.14);
  --surface: rgba(255,255,255,.65); --surface-2: rgba(20,20,40,.06); --surface-solid: #fffdf8;
  --line: rgba(30,25,15,.09); --line-2: rgba(30,25,15,.18);
  --fg: #1b1a17; --muted: #6e6a60; --faint: #a19c90;
  --accent: #4b63e6; --accent-2: #d9468f; --on-accent: #fff;
  --danger: #e0244a; --warn: #c97a00; --ok: #0f9d6a;
  --panel: #fffdf8; --board: #e6e0d3; --glow: .35;
  color-scheme: light;
}
[data-theme="mono"] {
  --bg: #000; --bg-glow-1: rgba(255,255,255,.06); --bg-glow-2: rgba(255,255,255,.03);
  --surface: rgba(255,255,255,.03); --surface-2: rgba(255,255,255,.08); --surface-solid: #0b0b0b;
  --line: rgba(255,255,255,.1); --line-2: rgba(255,255,255,.22);
  --fg: #fff; --muted: #8a8a8a; --faint: #555;
  --accent: #fff; --accent-2: #9a9a9a; --on-accent: #000;
  --danger: #ff4d4d; --warn: #fff;
  --panel: #0a0a0a; --board: #000; --glow: .3; --mono-player: 1;
  color-scheme: dark;
}
[data-theme="contrast"] {
  --bg: #000; --bg-glow-1: transparent; --bg-glow-2: transparent;
  --surface: #0a0a0a; --surface-2: #1f1f1f; --surface-solid: #000;
  --line: #4d4d4d; --line-2: #ffffff;
  --fg: #fff; --muted: #d0d0d0; --faint: #a0a0a0;
  --accent: #ffe500; --accent-2: #00e5ff; --on-accent: #000;
  --danger: #ff3b3b; --warn: #ffe500; --ok: #00ff88;
  --panel: #000; --board: #333; --glow: 1;
  color-scheme: dark;
}

/* clock fonts */
:root { --clock-font: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; --clock-weight: 800; --clock-track: -0.04em; }
[data-font="grotesk"] { --clock-font: "Space Grotesk", "Inter", system-ui, sans-serif; --clock-weight: 700; --clock-track: -0.05em; }
[data-font="digital"] { --clock-font: "Orbitron", "JetBrains Mono", monospace; --clock-weight: 800; --clock-track: 0.02em; }
[data-font="serif"] { --clock-font: "Fraunces", Georgia, serif; --clock-weight: 800; --clock-track: -0.03em; }
[data-font="system"] { --clock-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif; --clock-weight: 700; --clock-track: -0.04em; }

/* ---------- base ---------- */
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { height: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 15px/1.45 "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
  transition: background-color .4s ease, color .4s ease;
}
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
.hidden { display: none !important; }
.i { width: 1.15em; height: 1.15em; flex: none; vertical-align: -0.2em; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ---------- setup ---------- */
.setup {
  min-height: 100%; padding: 0 16px 140px;
  background:
    radial-gradient(900px 520px at 12% -8%, var(--bg-glow-1), transparent 60%),
    radial-gradient(800px 520px at 100% 10%, var(--bg-glow-2), transparent 60%),
    var(--bg);
  background-attachment: fixed;
}
.s-head {
  max-width: 1120px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;
  padding: calc(14px + env(safe-area-inset-top)) 0 10px;
}
.logo { display: flex; align-items: center; gap: 10px; color: var(--fg); text-decoration: none; font-weight: 800; letter-spacing: -0.02em; font-size: 1.15rem; }
.logo-mark svg { width: 32px; height: 32px; display: block; filter: drop-shadow(0 6px 18px rgba(124,156,255,.45)); }
.logo em { font-style: normal; color: var(--muted); font-weight: 600; }
.s-head-actions { display: flex; gap: 8px; }
.icon-btn {
  width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
  border: 1px solid var(--line); background: var(--surface); color: var(--fg);
  transition: border-color .2s, background .2s, transform .15s;
}
.icon-btn:hover { border-color: var(--line-2); background: var(--surface-2); }
.icon-btn:active { transform: scale(.94); }

.hero {
  max-width: 1120px; margin: 18px auto 26px; display: grid; gap: 28px;
  grid-template-columns: 1.1fr 1fr; align-items: center;
}
.hero h1 { font-size: clamp(2.2rem, 5.4vw, 3.9rem); line-height: 1.02; letter-spacing: -0.045em; margin: 0 0 14px; font-weight: 800; }
.grad {
  background: linear-gradient(100deg, var(--accent), var(--accent-2) 60%, var(--accent));
  background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: grad-move 8s ease-in-out infinite;
}
@keyframes grad-move { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.hero p { color: var(--muted); font-size: 1.05rem; max-width: 34ch; margin: 0; }

/* live preview */
.preview {
  aspect-ratio: 16 / 10; border-radius: 26px; padding: 8px; display: flex; flex-direction: column; gap: 6px;
  background: var(--board); border: 1px solid var(--line-2);
  box-shadow: 0 30px 80px -30px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.02) inset;
  transform: perspective(1200px) rotateY(-9deg) rotateX(4deg); transition: transform .6s cubic-bezier(.2,.8,.2,1);
}
.preview:hover { transform: perspective(1200px) rotateY(0) rotateX(0); }
.pv-row { flex: 1; display: flex; gap: 6px; min-height: 0; }
.pv-tile {
  --pc: #7c9cff; flex: 1; min-width: 0; border-radius: 16px; background: var(--panel); position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center; container-type: size;
  transition: background .4s, box-shadow .4s;
}
.pv-tile.flip { transform: rotate(180deg); }
.pv-tile .pv-fill { position: absolute; inset: auto 0 0 0; background: color-mix(in srgb, var(--pc) 16%, transparent); transition: height .9s linear; }
.pv-tile.on { background: color-mix(in srgb, var(--pc) 14%, var(--panel)); box-shadow: inset 0 0 0 2px var(--pc), 0 0 30px -6px color-mix(in srgb, var(--pc) calc(var(--glow) * 100%), transparent); }
.pv-tile.on .pv-fill { background: color-mix(in srgb, var(--pc) 26%, transparent); }
.pv-name { position: relative; font-size: clamp(9px, 9cqh, 13px); color: var(--muted); font-weight: 600; display: flex; align-items: center; gap: 5px; max-width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-name::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--pc); flex: none; }
.pv-time { position: relative; font-family: var(--clock-font); font-weight: var(--clock-weight); letter-spacing: var(--clock-track); font-variant-numeric: tabular-nums; font-size: min(24cqw, 40cqh); line-height: 1; color: var(--muted); }
.pv-tile.on .pv-time { color: var(--fg); }

/* resume card */
.resume-card {
  max-width: 1120px; margin: 0 auto 18px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 14px 16px; border-radius: 18px; border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  background: linear-gradient(100deg, color-mix(in srgb, var(--accent) 16%, transparent), color-mix(in srgb, var(--accent-2) 10%, transparent));
  animation: rise .5s cubic-bezier(.2,.8,.2,1);
}
.resume-pulse { width: 12px; height: 12px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 0 0 var(--ok); animation: ping 1.8s infinite; flex: none; }
@keyframes ping { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ok) 60%, transparent); } 100% { box-shadow: 0 0 0 14px transparent; } }
.resume-text { flex: 1; min-width: 180px; display: flex; flex-direction: column; }
.resume-text span { color: var(--muted); font-size: .88rem; }
.resume-actions { display: flex; gap: 8px; }

/* cards */
.cards { max-width: 1120px; margin: 0 auto; columns: 2 420px; column-gap: 18px; }
.card {
  break-inside: avoid; margin: 0 0 18px; padding: 20px; border-radius: 22px;
  background: var(--surface); border: 1px solid var(--line);
  backdrop-filter: blur(18px) saturate(1.2); -webkit-backdrop-filter: blur(18px) saturate(1.2);
  animation: rise .6s cubic-bezier(.2,.8,.2,1) both;
}
.card:nth-child(2) { animation-delay: .04s; } .card:nth-child(3) { animation-delay: .08s; } .card:nth-child(4) { animation-delay: .12s; }
.card:nth-child(5) { animation-delay: .16s; } .card:nth-child(6) { animation-delay: .2s; } .card:nth-child(7) { animation-delay: .24s; }
.card-wide { column-span: all; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.card h2 { display: flex; align-items: center; gap: 9px; font-size: 1.02rem; letter-spacing: -0.01em; margin: 0 0 14px; font-weight: 700; }
.card h2 .i { color: var(--accent); }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.card-head h2 { margin: 0; }

.field { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 11px 0; border-top: 1px solid var(--line); }
.card h2 + .field, .card-head + .field, .field:first-child { border-top: 0; }
.field.col { flex-direction: column; align-items: stretch; gap: 10px; }
.field > span:first-child { display: flex; flex-direction: column; min-width: 0; }
.field b { font-weight: 600; font-size: .93rem; }
.field small { color: var(--muted); font-size: .8rem; line-height: 1.35; }
.toggle { cursor: pointer; }
.sub { padding-left: 14px; margin-left: 4px; border-left: 2px solid color-mix(in srgb, var(--accent) 40%, transparent); }
.sub .field:first-child { border-top: 0; }
.explain { color: var(--muted); font-size: .84rem; margin: 10px 2px 2px; line-height: 1.45; min-height: 1.2em; }

/* switch */
.switch {
  appearance: none; -webkit-appearance: none; width: 48px; height: 28px; flex: none; border-radius: 99px; margin: 0;
  background: var(--surface-2); border: 1px solid var(--line-2); position: relative; cursor: pointer;
  transition: background .25s, border-color .25s;
}
.switch::before {
  content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
  background: var(--fg); opacity: .75; transition: transform .3s cubic-bezier(.3,1.5,.5,1), opacity .2s, background .2s;
  box-shadow: 0 2px 6px rgba(0,0,0,.35);
}
.switch:checked { background: linear-gradient(135deg, var(--accent), var(--accent-2)); border-color: transparent; }
.switch:checked::before { transform: translateX(20px); opacity: 1; background: #fff; }

/* segmented */
.seg {
  display: flex; gap: 3px; padding: 4px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--line);
  position: relative; flex-wrap: wrap;
}
.seg button {
  flex: 1 1 auto; border: 0; background: transparent; color: var(--muted); padding: 9px 12px; border-radius: 10px;
  font-size: .86rem; font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  transition: color .2s, background .25s, box-shadow .25s, transform .12s;
}
.seg button:hover { color: var(--fg); }
.seg button:active { transform: scale(.96); }
.seg button.on { background: var(--surface-solid); color: var(--fg); box-shadow: 0 1px 0 var(--line-2) inset, 0 6px 16px -8px rgba(0,0,0,.6), 0 0 0 1px var(--line-2); }
.seg button.on .i { color: var(--accent); }
.seg.sm button { padding: 7px 10px; font-size: .82rem; }
.seg-scroll { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
.seg-scroll::-webkit-scrollbar { display: none; }

/* stepper */
.stepper { display: inline-flex; align-items: center; gap: 4px; padding: 4px; border-radius: 99px; background: var(--surface-2); border: 1px solid var(--line); }
.stepper button { width: 34px; height: 34px; border-radius: 50%; border: 0; display: grid; place-items: center; background: var(--surface-solid); color: var(--fg); transition: transform .12s, background .2s; }
.stepper button:hover { background: color-mix(in srgb, var(--accent) 22%, var(--surface-solid)); }
.stepper button:active { transform: scale(.88); }
.stepper button:disabled { opacity: .3; cursor: default; }
.stepper output { min-width: 34px; text-align: center; font-weight: 800; font-size: 1.05rem; font-variant-numeric: tabular-nums; }
.stepper.sm button { width: 28px; height: 28px; }
.stepper.sm output { min-width: 26px; font-size: .95rem; }

/* inputs */
.num { display: inline-flex; align-items: center; gap: 6px; }
.num i { font-style: normal; color: var(--muted); font-size: .85rem; }
input[type="number"], .text-in {
  background: var(--surface-solid); border: 1px solid var(--line-2); border-radius: 10px; padding: 8px 10px;
  width: 78px; text-align: center; font-weight: 600; font-variant-numeric: tabular-nums; transition: border-color .2s, box-shadow .2s;
}
.text-in { width: 160px; text-align: left; }
input[type="number"]:focus, .text-in:focus, .p-row input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent); }
input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }

.time-big { display: flex; align-items: flex-start; justify-content: center; gap: 6px; padding: 6px 0 4px; }
.time-big label { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.time-big input {
  width: 2.9em; font-size: clamp(2.6rem, 8vw, 3.6rem); padding: 4px 0; border-radius: 18px; border-width: 1px;
  font-family: var(--clock-font); font-weight: var(--clock-weight); letter-spacing: var(--clock-track);
  background: var(--surface-solid); line-height: 1.1;
}
.time-big label span { font-size: .72rem; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); font-weight: 600; }
.time-big b { font-family: var(--clock-font); font-size: clamp(2.2rem, 7vw, 3rem); color: var(--faint); padding-top: 6px; }
.quick-times { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 10px 0 14px; }

.chip-btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: 99px;
  border: 1px solid var(--line-2); background: var(--surface); color: var(--fg); font-size: .84rem; font-weight: 600;
  transition: border-color .2s, background .2s, transform .12s;
}
.chip-btn:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.chip-btn:active { transform: scale(.95); }
.chip-btn.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--fg); }
.chip-btn.danger:hover { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, transparent); }
.row-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 4px; }
.link-btn { border: 0; background: none; color: var(--accent); font-weight: 600; font-size: .86rem; display: inline-flex; gap: 6px; align-items: center; padding: 6px; border-radius: 8px; }
.link-btn:hover { background: color-mix(in srgb, var(--accent) 12%, transparent); }

.range-wrap { display: inline-flex; align-items: center; gap: 10px; flex: 1; justify-content: flex-end; }
input[type="range"] { -webkit-appearance: none; appearance: none; width: min(180px, 100%); height: 6px; border-radius: 99px; background: linear-gradient(90deg, var(--accent) var(--fillp, 50%), var(--surface-2) var(--fillp, 50%)); outline: none; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.4); cursor: pointer; }
input[type="range"]::-moz-range-thumb { width: 20px; height: 20px; border: 0; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.4); cursor: pointer; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 12px; border: 1px solid var(--line-2); background: var(--surface); font-weight: 700; font-size: .9rem; transition: transform .12s, filter .2s, background .2s; }
.btn:active { transform: scale(.96); }
.btn.primary { border: 0; color: var(--on-accent); background: linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow: 0 10px 30px -12px var(--accent); }
.btn.primary:hover { filter: brightness(1.08); }
.btn.ghost { background: transparent; }
.btn.big { padding: 16px 30px; font-size: 1.1rem; border-radius: 18px; }
.btn.danger { border-color: color-mix(in srgb, var(--danger) 50%, transparent); color: var(--danger); }

/* presets */
.presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.preset {
  position: relative; text-align: left; padding: 14px 14px 12px; border-radius: 16px; border: 1px solid var(--line);
  background: var(--surface); display: flex; flex-direction: column; gap: 3px; overflow: hidden;
  transition: transform .2s cubic-bezier(.2,.8,.2,1), border-color .2s, background .2s, box-shadow .2s;
}
.preset::after { content: ""; position: absolute; inset: 0; background: radial-gradient(160px 80px at var(--mx, 50%) var(--my, 0%), color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%); opacity: 0; transition: opacity .3s; pointer-events: none; }
.preset:hover { transform: translateY(-2px); border-color: var(--line-2); }
.preset:hover::after { opacity: 1; }
.preset:active { transform: scale(.97); }
.preset.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); box-shadow: 0 10px 30px -16px var(--accent); }
.preset .pe { font-size: 1.25rem; line-height: 1; margin-bottom: 6px; }
.preset .pn { font-weight: 700; font-size: .93rem; }
.preset .ps { color: var(--muted); font-size: .78rem; font-variant-numeric: tabular-nums; }
.preset .pdel { position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; border-radius: 8px; border: 0; background: transparent; color: var(--muted); display: grid; place-items: center; opacity: .6; z-index: 1; }
.preset .pdel:hover { opacity: 1; color: var(--danger); background: var(--surface-2); }

/* players list */
.player-list { display: flex; flex-direction: column; gap: 8px; }
.p-row {
  --pc: #7c9cff; display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 10px; border-radius: 14px;
  background: var(--surface-2); border: 1px solid var(--line); position: relative; animation: rise .35s cubic-bezier(.2,.8,.2,1) both;
  flex-wrap: wrap;
}
.p-row::before { content: ""; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0; background: var(--pc); }
.p-seat { width: 22px; text-align: center; font-weight: 800; color: var(--faint); font-size: .8rem; font-variant-numeric: tabular-nums; }
.p-swatch { width: 30px; height: 30px; border-radius: 10px; border: 2px solid color-mix(in srgb, var(--pc) 50%, transparent); background: var(--pc); flex: none; box-shadow: 0 0 16px -4px var(--pc); transition: transform .15s; }
.p-swatch:hover { transform: scale(1.08); }
.p-row input[type="text"] { flex: 1; min-width: 90px; background: transparent; border: 1px solid transparent; border-radius: 10px; padding: 7px 9px; font-weight: 600; }
.p-row input[type="text"]:hover { border-color: var(--line-2); }
.p-row .p-times { display: inline-flex; align-items: center; gap: 4px; }
.p-row .p-times input { width: 56px; padding: 6px 4px; }
.p-row .p-times i { font-style: normal; color: var(--muted); font-size: .78rem; }
.p-palette { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 8px; padding: 6px 0 4px 32px; }
.p-palette button { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; background: var(--c); transition: transform .15s; }
.p-palette button:hover { transform: scale(1.15); }
.p-palette button.on { border-color: var(--fg); box-shadow: 0 0 0 2px var(--bg) inset; }

/* themes & fonts pickers */
.themes { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; }
.theme-opt {
  border-radius: 14px; border: 2px solid var(--line); padding: 0; overflow: hidden; background: none; text-align: left;
  transition: transform .2s, border-color .2s;
}
.theme-opt:hover { transform: translateY(-2px); }
.theme-opt.on { border-color: var(--accent); }
.theme-sw { height: 58px; display: flex; align-items: flex-end; gap: 4px; padding: 8px; }
.theme-sw span { flex: 1; height: 60%; border-radius: 6px; }
.theme-sw span:first-child { height: 100%; }
.theme-opt b { display: block; padding: 7px 10px; font-size: .82rem; background: var(--surface); }
.fonts { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
.font-opt {
  border-radius: 14px; border: 2px solid var(--line); background: var(--surface); padding: 12px 8px 8px; display: flex; flex-direction: column; align-items: center; gap: 4px;
  transition: transform .2s, border-color .2s;
}
.font-opt:hover { transform: translateY(-2px); }
.font-opt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
.font-opt .fs { font-size: 1.7rem; line-height: 1.1; font-variant-numeric: tabular-nums; }
.font-opt small { color: var(--muted); font-size: .75rem; }
.look-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 16px; }
.look-grid .field { border-top: 1px solid var(--line); }
.share-card { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.share-card h2 { margin-bottom: 4px; }
.share-card .explain { margin: 0; }

/* sticky start bar */
.start-bar {
  position: fixed; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom)); transform: translateX(-50%);
  width: min(720px, calc(100% - 24px)); z-index: 30; display: flex; align-items: center; gap: 12px;
  padding: 10px 10px 10px 20px; border-radius: 22px;
  background: color-mix(in srgb, var(--surface-solid) 78%, transparent); border: 1px solid var(--line-2);
  backdrop-filter: blur(22px) saturate(1.4); -webkit-backdrop-filter: blur(22px) saturate(1.4);
  box-shadow: 0 20px 60px -20px rgba(0,0,0,.7);
}
.start-summary { flex: 1; min-width: 0; font-size: .86rem; color: var(--muted); line-height: 1.3; }
.start-summary b { color: var(--fg); display: block; font-size: .98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.start-summary span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-start {
  position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 10px; border: 0;
  padding: 16px 28px; border-radius: 16px; font-size: 1.1rem; font-weight: 800; letter-spacing: -0.01em;
  color: var(--on-accent); background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 12px 34px -10px var(--accent); transition: transform .15s, box-shadow .2s, filter .2s;
}
.btn-start::after { content: ""; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%); transform: translateX(-120%); animation: shine 3.6s ease-in-out infinite; }
@keyframes shine { 0%, 60% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
.btn-start:hover { filter: brightness(1.08); box-shadow: 0 16px 40px -10px var(--accent); }
.btn-start:active { transform: scale(.96); }
.btn-start .i { transition: transform .2s; }
.btn-start:hover .i { transform: translateX(3px); }

/* ---------- game ---------- */
.game { position: fixed; inset: 0; background: var(--board); overflow: hidden; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.board {
  position: absolute; inset: 0; display: flex; flex-direction: column; gap: 6px;
  padding: max(6px, env(safe-area-inset-top)) max(6px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left));
}
.b-row { flex: 1; display: flex; gap: 6px; min-height: 0; }
.panel {
  --pc: #7c9cff; --pct: 1; flex: 1; min-width: 0; position: relative; overflow: hidden; border-radius: 26px;
  background: var(--panel); container-type: size; cursor: pointer; isolation: isolate;
  transition: background .35s ease, box-shadow .35s ease, filter .4s ease, opacity .4s ease;
}
[data-theme="mono"] .panel, [data-theme="mono"] .pv-tile, [data-theme="mono"] .p-row { --pc: #ffffff !important; }
.panel.flip { transform: rotate(180deg); }
.panel .fill {
  position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--pct) * 100%); z-index: -1;
  background: linear-gradient(to top, color-mix(in srgb, var(--pc) 22%, transparent), color-mix(in srgb, var(--pc) 8%, transparent));
  transition: height .25s linear, background .35s;
}
.panel .fill::before {
  content: ""; position: absolute; left: -50%; right: -50%; top: -14px; height: 28px;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--pc) 40%, transparent), transparent);
  opacity: 0; transition: opacity .4s;
}
.panel.active .fill::before { opacity: .9; animation: wave 3.2s ease-in-out infinite; }
@keyframes wave { 0%, 100% { transform: translateX(-8%) scaleY(1); } 50% { transform: translateX(8%) scaleY(1.4); } }
.panel .bar { position: absolute; left: 14px; right: 14px; bottom: 12px; height: 6px; border-radius: 99px; background: var(--surface-2); overflow: hidden; z-index: 1; }
.panel .bar > i { position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--pct) * 100%); border-radius: 99px; background: var(--pc); transition: width .25s linear; }
.panel .ring { position: absolute; inset: 0; margin: auto; width: min(86cqw, 86cqh); height: min(86cqw, 86cqh); z-index: -1; pointer-events: none; transform: rotate(-90deg); }
.panel .ring circle { fill: none; stroke-width: 3; }
.panel .ring .rt { stroke: var(--surface-2); }
.panel .ring .rb { stroke: var(--pc); stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: calc(100 - var(--pct) * 100); transition: stroke-dashoffset .25s linear; opacity: .55; }
.panel.active .ring .rb { opacity: 1; filter: drop-shadow(0 0 6px var(--pc)); }
[data-progress="fill"] .panel .bar, [data-progress="fill"] .panel .ring,
[data-progress="bar"] .panel .fill, [data-progress="bar"] .panel .ring,
[data-progress="ring"] .panel .fill, [data-progress="ring"] .panel .bar,
[data-progress="none"] .panel .fill, [data-progress="none"] .panel .bar, [data-progress="none"] .panel .ring { display: none; }

.panel.active {
  background: color-mix(in srgb, var(--pc) 13%, var(--panel));
  box-shadow: inset 0 0 0 3px var(--pc), 0 0 60px -10px color-mix(in srgb, var(--pc) calc(var(--glow) * 100%), transparent);
}
.panel.active::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: inset 0 0 50px -10px color-mix(in srgb, var(--pc) calc(var(--glow) * 90%), transparent);
  animation: breathe 2.4s ease-in-out infinite;
}
@keyframes breathe { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
.game:not(.is-running) .panel.active::after, .game:not(.is-running) .panel.active .fill::before { animation: none; }
.panel.waiting .p-time { opacity: .45; }
.panel.out { filter: grayscale(.9); opacity: .55; cursor: default; }
.panel.out .p-time { text-decoration: line-through; text-decoration-thickness: .06em; }
.panel.low { animation: low-bg 1s ease-in-out infinite; }
.panel.low .p-time { color: var(--danger); }
.panel.low.active { box-shadow: inset 0 0 0 3px var(--danger), 0 0 70px -10px var(--danger); }
@keyframes low-bg { 0%, 100% { background-color: color-mix(in srgb, var(--danger) 8%, var(--panel)); } 50% { background-color: color-mix(in srgb, var(--danger) 24%, var(--panel)); } }
.panel.overtime .p-time { color: var(--danger); }
.panel.limit-flash { animation: limit-flash .5s ease 3; }
@keyframes limit-flash { 50% { background: color-mix(in srgb, var(--warn) 30%, var(--panel)); } }
.panel.bump .p-time { animation: bump .35s cubic-bezier(.3,1.6,.5,1); }
@keyframes bump { 0% { transform: scale(1); } 40% { transform: scale(1.06); } 100% { transform: scale(1); } }

.p-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8cqh 6cqw; gap: 2cqh; pointer-events: none; }
.p-head { display: flex; align-items: center; gap: 8px; max-width: 86%; font-size: clamp(12px, min(5.4cqw, 8cqh), 22px); font-weight: 700; color: var(--muted); transition: color .3s; }
.panel.active .p-head { color: var(--fg); }
.p-head .dot { width: .62em; height: .62em; border-radius: 50%; background: var(--pc); flex: none; box-shadow: 0 0 12px var(--pc); }
.p-head .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.p-time {
  font-family: var(--clock-font); font-weight: var(--clock-weight); letter-spacing: var(--clock-track);
  font-variant-numeric: tabular-nums; line-height: .95; white-space: nowrap; color: color-mix(in srgb, var(--fg) 50%, transparent);
  font-size: min(25cqw, 44cqh); transition: color .3s, opacity .3s;
}
.p-time[data-len="5"] { font-size: min(21cqw, 42cqh); }
.p-time[data-len="6"] { font-size: min(18cqw, 40cqh); }
.p-time[data-len="7"], .p-time[data-len="8"] { font-size: min(15cqw, 36cqh); }
.p-time .tenth { font-size: .55em; opacity: .75; }
.panel.active .p-time { color: var(--fg); text-shadow: 0 0 40px color-mix(in srgb, var(--pc) calc(var(--glow) * 70%), transparent); }
.panel.active.low .p-time, .panel.overtime .p-time { color: var(--danger); }
.p-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; min-height: 1.6em; font-size: clamp(10px, min(3.6cqw, 5.6cqh), 15px); }
.tag {
  display: inline-flex; align-items: center; gap: 5px; padding: .25em .7em; border-radius: 99px; font-weight: 700; letter-spacing: .02em;
  background: var(--surface-2); color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap;
}
.tag.hot { background: color-mix(in srgb, var(--danger) 22%, transparent); color: var(--danger); }
.tag.warn { background: color-mix(in srgb, var(--warn) 20%, transparent); color: var(--warn); }
.tag.pc { background: color-mix(in srgb, var(--pc) 20%, transparent); color: color-mix(in srgb, var(--pc) 70%, var(--fg)); }
.tag.go { background: var(--pc); color: #fff; animation: go-pulse 1.4s ease-in-out infinite; text-shadow: 0 1px 2px rgba(0,0,0,.3); }
@keyframes go-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--pc) 60%, transparent); } 50% { transform: scale(1.05); box-shadow: 0 0 0 10px transparent; } }
.p-pass {
  pointer-events: auto; margin-top: 1cqh; padding: .55em 1.4em; border-radius: 99px; border: 2px solid var(--pc);
  background: color-mix(in srgb, var(--pc) 16%, transparent); color: var(--fg); font-weight: 800; letter-spacing: .04em;
  font-size: clamp(12px, min(4.4cqw, 6.5cqh), 20px); transition: transform .12s, background .2s, opacity .2s;
}
.p-pass:hover { background: color-mix(in srgb, var(--pc) 32%, transparent); }
.p-pass:active { transform: scale(.94); }
.p-pass:disabled { opacity: .25; cursor: default; }
.p-menu {
  position: absolute; top: 10px; right: 10px; width: 40px; height: 40px; border-radius: 13px; border: 0; z-index: 2;
  display: grid; place-items: center; background: transparent; color: var(--muted); opacity: .55; transition: opacity .2s, background .2s;
}
.p-menu:hover { opacity: 1; background: var(--surface-2); }
.p-seatno { position: absolute; top: 14px; left: 18px; font-size: 12px; font-weight: 800; color: var(--faint); letter-spacing: .08em; pointer-events: none; }
.ripple { position: absolute; border-radius: 50%; pointer-events: none; background: color-mix(in srgb, var(--pc) 45%, transparent); transform: translate(-50%, -50%) scale(0); animation: ripple .6s ease-out forwards; z-index: 0; }
@keyframes ripple { to { transform: translate(-50%, -50%) scale(1); opacity: 0; } }

/* dock */
.dock {
  position: absolute; z-index: 20; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom)); transform: translateX(-50%);
  display: flex; align-items: center; gap: 4px; padding: 6px; border-radius: 22px;
  background: color-mix(in srgb, var(--surface-solid) 72%, transparent); border: 1px solid var(--line-2);
  backdrop-filter: blur(20px) saturate(1.5); -webkit-backdrop-filter: blur(20px) saturate(1.5);
  box-shadow: 0 18px 50px -14px rgba(0,0,0,.75); transition: opacity .35s, transform .35s;
}
.dock.center { top: 50%; bottom: auto; transform: translate(-50%, -50%); }
.dock.idle { opacity: .28; }
.dock:hover { opacity: 1; }
.dock-btn { width: 46px; height: 46px; border-radius: 16px; border: 0; background: transparent; color: var(--fg); display: grid; place-items: center; transition: background .2s, transform .12s; }
.dock-btn .i { width: 21px; height: 21px; }
.dock-btn:hover { background: var(--surface-2); }
.dock-btn:active { transform: scale(.9); }
.dock-btn:disabled { opacity: .3; }
.dock-btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: var(--on-accent); }
.dock-info { display: flex; flex-direction: column; align-items: center; padding: 0 10px; min-width: 76px; line-height: 1.15; }
.dock-info b { font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); font-weight: 700; white-space: nowrap; }
.dock-info span { font-family: var(--clock-font); font-variant-numeric: tabular-nums; font-weight: 700; font-size: .95rem; }

.paused-overlay {
  position: absolute; inset: 0; z-index: 25; display: grid; place-items: center;
  background: color-mix(in srgb, var(--board) 55%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  animation: fade .25s ease;
}
.paused-inner { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 20px; text-align: center; }
.paused-label { font-size: clamp(2.6rem, 10vw, 5rem); font-weight: 800; letter-spacing: -0.04em; background: linear-gradient(100deg, var(--fg), var(--muted)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.paused-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }

/* pass overlay */
.pass-overlay {
  position: fixed; inset: 0; z-index: 60; display: none; align-items: center; justify-content: center;
  background: radial-gradient(circle at center, color-mix(in srgb, var(--pc, var(--accent)) 26%, transparent), rgba(0,0,0,.82) 70%);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.pass-overlay.open { display: flex; animation: fade .2s ease; }
.pass-ring { position: relative; width: min(82vw, 82vh, 560px); aspect-ratio: 1; }
.pass-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.pass-ring circle { fill: none; stroke-width: 8; }
.pr-track { stroke: rgba(255,255,255,.1); }
.pr-bar { stroke: var(--pc, var(--accent)); stroke-linecap: round; stroke-dasharray: 565.5; transition: stroke-dashoffset 1s linear; filter: drop-shadow(0 0 14px var(--pc, var(--accent))); }
.pass-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.pass-label { font-size: clamp(1rem, 4vw, 1.6rem); font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: #fff; opacity: .9; }
.pass-number { font-family: var(--clock-font); font-weight: var(--clock-weight); font-size: clamp(6rem, 32vmin, 15rem); line-height: 1; color: #fff; text-shadow: 0 0 60px var(--pc, var(--accent)); }
.pass-number.pop { animation: pop .5s cubic-bezier(.3,1.6,.5,1); }
@keyframes pop { 0% { transform: scale(1.35); opacity: .3; } 100% { transform: scale(1); opacity: 1; } }
.pass-who { color: rgba(255,255,255,.75); font-weight: 600; margin-top: 6px; }

/* modal */
.modal { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: fade .2s ease; }
.modal-card {
  position: relative; width: min(520px, 100%); max-height: calc(100% - 24px); overflow: auto; border-radius: 26px; padding: 22px;
  background: var(--surface-solid); border: 1px solid var(--line-2); box-shadow: 0 40px 100px -20px rgba(0,0,0,.8);
  animation: modal-in .35s cubic-bezier(.2,1.2,.3,1);
}
.modal-card.wide { width: min(720px, 100%); }
@keyframes modal-in { from { opacity: 0; transform: translateY(24px) scale(.96); } to { opacity: 1; transform: none; } }
@media (max-width: 560px) {
  .modal { align-items: flex-end; padding: 0; }
  .modal-card { width: 100%; border-radius: 26px 26px 0 0; padding-bottom: calc(22px + env(safe-area-inset-bottom)); animation: sheet-in .35s cubic-bezier(.2,1,.3,1); }
  @keyframes sheet-in { from { transform: translateY(100%); } to { transform: none; } }
}
.m-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.m-head h3 { margin: 0; font-size: 1.25rem; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
.m-close { width: 36px; height: 36px; border-radius: 12px; border: 0; background: var(--surface-2); display: grid; place-items: center; }
.m-section { padding: 14px 0; border-top: 1px solid var(--line); }
.m-section:first-of-type { border-top: 0; padding-top: 4px; }
.m-label { font-size: .75rem; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); font-weight: 700; margin-bottom: 10px; }
.adj-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.adj-grid button { padding: 12px 4px; border-radius: 12px; border: 1px solid var(--line-2); background: var(--surface); font-weight: 800; font-variant-numeric: tabular-nums; transition: transform .12s, background .2s; }
.adj-grid button:hover { background: var(--surface-2); }
.adj-grid button:active { transform: scale(.93); }
.adj-grid .neg { color: var(--danger); } .adj-grid .pos { color: var(--ok); }
.m-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.m-actions .btn { flex: 1 1 140px; }
.m-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line-2); background: var(--surface); font-size: 1.05rem; font-weight: 600; }
.m-input:focus { outline: none; border-color: var(--accent); }
.big-time { font-family: var(--clock-font); font-weight: var(--clock-weight); font-size: 2.6rem; text-align: center; font-variant-numeric: tabular-nums; margin: 4px 0 12px; }
.menu-list { display: flex; flex-direction: column; gap: 6px; }
.menu-item { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--surface); text-align: left; font-weight: 600; transition: background .2s, border-color .2s; }
.menu-item:hover { background: var(--surface-2); border-color: var(--line-2); }
.menu-item .i { color: var(--accent); width: 20px; height: 20px; }
.menu-item small { display: block; color: var(--muted); font-weight: 500; font-size: .8rem; }
.menu-item kbd, .keys kbd { margin-left: auto; }
kbd { font: 700 .75rem "JetBrains Mono", monospace; padding: 3px 7px; border-radius: 6px; background: var(--surface-2); border: 1px solid var(--line-2); border-bottom-width: 2px; color: var(--fg); white-space: nowrap; }
.keys { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; align-items: center; font-size: .92rem; }

/* results */
.podium { display: flex; align-items: flex-end; justify-content: center; gap: 10px; margin: 6px 0 18px; }
.pod { --pc: #7c9cff; flex: 1; max-width: 150px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.pod .pod-name { font-weight: 700; font-size: .9rem; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pod .pod-block { width: 100%; border-radius: 14px 14px 6px 6px; display: grid; place-items: center; font-weight: 900; font-size: 1.6rem; color: #fff;
  background: linear-gradient(to bottom, var(--pc), color-mix(in srgb, var(--pc) 50%, #000)); box-shadow: 0 10px 30px -10px var(--pc); animation: grow .7s cubic-bezier(.2,1.2,.3,1) both; transform-origin: bottom; }
.pod:nth-child(1) .pod-block { animation-delay: .25s; } .pod:nth-child(3) .pod-block { animation-delay: .4s; }
@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.winner-banner { text-align: center; margin: 2px 0 10px; }
.winner-banner .wb-kicker { font-size: .75rem; text-transform: uppercase; letter-spacing: .2em; color: var(--muted); font-weight: 700; }
.winner-banner .wb-name { font-size: clamp(1.8rem, 6vw, 2.6rem); font-weight: 800; letter-spacing: -0.03em; }
.stats { width: 100%; border-collapse: collapse; font-size: .86rem; font-variant-numeric: tabular-nums; }
.stats th { text-align: right; color: var(--muted); font-weight: 600; font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; padding: 8px 6px; border-bottom: 1px solid var(--line-2); }
.stats td { text-align: right; padding: 10px 6px; border-bottom: 1px solid var(--line); }
.stats th:first-child, .stats td:first-child { text-align: left; }
.stats .who { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.stats .who i { width: 10px; height: 10px; border-radius: 50%; background: var(--pc); flex: none; }
.stats-wrap { overflow-x: auto; margin: 0 -4px 16px; padding: 0 4px; }
.share-line { display: flex; gap: 8px; }

/* toasts */
.toasts { position: fixed; z-index: 90; left: 50%; top: calc(16px + env(safe-area-inset-top)); transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; }
.toast {
  padding: 10px 16px; border-radius: 14px; font-weight: 600; font-size: .9rem; display: flex; align-items: center; gap: 8px;
  background: color-mix(in srgb, var(--surface-solid) 88%, transparent); border: 1px solid var(--line-2); color: var(--fg);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 14px 40px -12px rgba(0,0,0,.7);
  animation: toast-in .35s cubic-bezier(.2,1.3,.3,1);
}
.toast .i { color: var(--accent); }
.toast.bye { animation: toast-out .3s ease forwards; }
@keyframes toast-in { from { opacity: 0; transform: translateY(-14px) scale(.95); } to { opacity: 1; transform: none; } }
@keyframes toast-out { to { opacity: 0; transform: translateY(-10px) scale(.97); } }
.confetti { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 80; }

/* ---------- responsive ---------- */
@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; gap: 20px; margin-top: 8px; }
  .preview { transform: none; aspect-ratio: 16 / 9; }
}
@media (max-width: 560px) {
  .setup { padding: 0 12px 150px; }
  .card { padding: 16px; border-radius: 20px; }
  .start-bar { padding: 8px 8px 8px 16px; border-radius: 20px; }
  .btn-start { padding: 14px 20px; }
  .start-summary span { display: none; }
  .dock-btn { width: 42px; height: 42px; }
  .dock-info { min-width: 62px; padding: 0 6px; }
  .field { flex-wrap: wrap; }
  .text-in { width: 100%; }
  .panel { border-radius: 20px; }
}
@media (max-width: 380px) { #fsBtn { display: none; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}
`;
}

// ======================================================================
// Client app. Written as a normal function so it can use any JS syntax
// (template literals included); the worker serves clientApp.toString().
// It must not reference anything from module scope except ICONS, which
// /app.js defines right before calling it.
// ======================================================================

function clientApp() {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (n) => '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[n] + "</svg>";

  const PALETTE = ["#5b8cff", "#ff5c7a", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#22d3ee", "#fb923c", "#a3e635", "#e879f9"];
  const NAMES = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7", "Player 8", "Player 9", "Player 10"];
  const STORE = "clock.settings.v2";
  const GAME_STORE = "clock.game.v2";
  const PRESET_STORE = "clock.presets.v2";
  const OLD_STORE = "clockmazzen.settings.v1";
  const MAX_PLAYERS = 10;

  const DEFAULTS = {
    numPlayers: 2, baseMinutes: 5, baseSeconds: 0, perPlayerTimes: false, players: [],
    timing: "none", increment: 0, byoPeriods: 3, byoSeconds: 30,
    turnMode: "clockwise", startPlayer: "first", tapAnywhere: false,
    atZero: "stop", moveLimitEnabled: false, moveLimit: 30, moveLimitAction: "warn",
    passEnabled: false, passLabel: "Pass", passDuration: 5, passMaxUses: 0, passPauses: false, passEndsTurn: false,
    lowTimeEnabled: true, lowTimeThreshold: 10, showTenths: true,
    soundEnabled: true, soundPack: "classic", volume: 70, tickLast: true, voiceEnabled: false, vibrate: true,
    theme: "midnight", font: "mono", layout: "auto", progress: "fill", dock: "auto", keepAwake: true, showMoves: true,
  };
  // Keys a preset / share link controls (everything about the rules, nothing about looks or sound).
  const RULE_KEYS = ["numPlayers", "baseMinutes", "baseSeconds", "perPlayerTimes", "timing", "increment", "byoPeriods", "byoSeconds",
    "turnMode", "startPlayer", "tapAnywhere", "atZero", "moveLimitEnabled", "moveLimit", "moveLimitAction",
    "passEnabled", "passLabel", "passDuration", "passMaxUses", "passPauses", "passEndsTurn", "layout"];
  const PRESET_BASE = { perPlayerTimes: false, baseSeconds: 0, timing: "none", increment: 0, turnMode: "clockwise", startPlayer: "first",
    tapAnywhere: false, atZero: "stop", moveLimitEnabled: false, passEnabled: false, layout: "auto" };

  const PRESETS = [
    { id: "bullet", e: "⚡", name: "Bullet", sub: "1 min", s: { numPlayers: 2, baseMinutes: 1, layout: "table" } },
    { id: "blitz", e: "🔥", name: "Blitz", sub: "3 + 2", s: { numPlayers: 2, baseMinutes: 3, timing: "increment", increment: 2, layout: "table" } },
    { id: "rapid", e: "♟️", name: "Rapid", sub: "10 + 5", s: { numPlayers: 2, baseMinutes: 10, timing: "increment", increment: 5, layout: "table" } },
    { id: "classical", e: "🏛️", name: "Classical", sub: "30 + 20", s: { numPlayers: 2, baseMinutes: 30, timing: "increment", increment: 20, layout: "table" } },
    { id: "tourney", e: "⏱️", name: "Tournament", sub: "90 min, 5s delay", s: { numPlayers: 2, baseMinutes: 90, timing: "delay", increment: 5, layout: "table" } },
    { id: "go", e: "⚫", name: "Go", sub: "10m + 3×30s byo-yomi", s: { numPlayers: 2, baseMinutes: 10, timing: "byoyomi", byoPeriods: 3, byoSeconds: 30, layout: "table" } },
    { id: "scrabble", e: "🔤", name: "Scrabble", sub: "25 min, overtime", s: { numPlayers: 2, baseMinutes: 25, atZero: "overtime", layout: "table" } },
    { id: "gamenight", e: "🎲", name: "Game night", sub: "4 × 10m + 10s", s: { numPlayers: 4, baseMinutes: 10, timing: "increment", increment: 10, layout: "table" } },
    { id: "speed", e: "🏎️", name: "Speed round", sub: "30s shot clock", s: { numPlayers: 4, baseMinutes: 20, moveLimitEnabled: true, moveLimit: 30, moveLimitAction: "pass", tapAnywhere: true, layout: "table" } },
    { id: "gameshow", e: "🎤", name: "Game show", sub: "3 × 2m, pass button", s: { numPlayers: 3, baseMinutes: 2, turnMode: "free", passEnabled: true, passDuration: 5, passMaxUses: 3, passPauses: true } },
    { id: "debate", e: "🎙️", name: "Debate", sub: "2 × 4m, overtime", s: { numPlayers: 2, baseMinutes: 4, turnMode: "free", atZero: "overtime" } },
    { id: "speech", e: "🗣️", name: "Speech", sub: "5 min, counts over", s: { numPlayers: 1, baseMinutes: 5, atZero: "overtime" } },
    { id: "slowest", e: "🐢", name: "Who's slowest?", sub: "Stopwatch, 4 players", s: { numPlayers: 4, timing: "countup", tapAnywhere: true, layout: "table" } },
  ];

  const THEMES = [
    { id: "midnight", name: "Midnight", sw: ["#0d111c", "#7c9cff", "#e879f9"] },
    { id: "aurora", name: "Aurora", sw: ["#081614", "#2dd4bf", "#818cf8"] },
    { id: "neon", name: "Neon", sw: ["#0e0318", "#ff3df2", "#00f0ff"] },
    { id: "sunset", name: "Sunset", sw: ["#1a0d12", "#ff8a5b", "#ff5288"] },
    { id: "paper", name: "Paper", sw: ["#fffdf8", "#4b63e6", "#d9468f"] },
    { id: "mono", name: "Mono", sw: ["#0a0a0a", "#ffffff", "#7a7a7a"] },
    { id: "contrast", name: "High contrast", sw: ["#000000", "#ffe500", "#00e5ff"] },
  ];
  const FONTS = [
    { id: "mono", name: "Mono" }, { id: "grotesk", name: "Grotesk" }, { id: "digital", name: "Digital" },
    { id: "serif", name: "Serif" }, { id: "system", name: "System" },
  ];
  const TIMING_TEXT = {
    none: "<b>Sudden death.</b> One pot of time per player. When it runs out, you're out.",
    increment: "<b>Fischer increment.</b> Bonus seconds are added to your clock after every move.",
    delay: "<b>Simple delay.</b> Each turn, your clock waits this many seconds before it starts counting down.",
    bronstein: "<b>Bronstein.</b> After each move you get back the time you used, up to this many seconds.",
    hourglass: "<b>Hourglass.</b> Time you spend flows into everyone else's clocks. Slow play feeds your opponents.",
    byoyomi: "<b>Byo-yomi.</b> When main time runs out you get extra periods. Move inside a period and it resets. Use one up and it's gone.",
    countup: "<b>Stopwatch.</b> Clocks count up so you can see who takes longest. Nobody runs out.",
  };
  const TURN_TEXT = {
    clockwise: "Tap your clock to pass to the next player: 1 → 2 → 3 → 1…",
    counter: "Same as in order, but backwards: 3 → 2 → 1 → 3…",
    snake: "Draft order. It bounces at each end: 1 → 2 → 3 → 3 → 2 → 1…",
    free: "No set order. Tap any player's clock to start their turn (or press 1–9 / 0).",
  };
  const LAYOUT_TEXT = {
    auto: "Fills the screen in the best grid for the device's orientation.",
    table: "Phone flat on the table. The far row is flipped to face the people across from you, seated in turn order.",
    stack: "One clock per row. Good for a big screen or a projector.",
  };

  // ------------------------------------------------------------------
  // settings
  // ------------------------------------------------------------------

  let settings = clone(DEFAULTS);

  function defaultPlayer(i, used) {
    const color = PALETTE.find((c) => !used.includes(c)) || PALETTE[i % PALETTE.length];
    return { name: NAMES[i], color, minutes: settings.baseMinutes, seconds: settings.baseSeconds };
  }
  function ensurePlayers() {
    if (!Array.isArray(settings.players)) settings.players = [];
    settings.players = settings.players.filter((p) => p && typeof p === "object");
    while (settings.players.length < settings.numPlayers) {
      settings.players.push(defaultPlayer(settings.players.length, settings.players.map((p) => p.color)));
    }
    settings.players.length = settings.numPlayers;
    settings.players.forEach((p, i) => {
      if (typeof p.name !== "string") p.name = NAMES[i];
      if (!/^#[0-9a-f]{6}$/i.test(p.color || "")) p.color = PALETTE[i % PALETTE.length];
      p.minutes = clamp(Number(p.minutes) || 0, 0, 999);
      p.seconds = clamp(Number(p.seconds) || 0, 0, 59);
    });
  }
  function sanitize(obj) {
    const out = {};
    Object.keys(DEFAULTS).forEach((k) => {
      if (obj[k] === undefined) return;
      if (k === "players") { if (Array.isArray(obj[k])) out[k] = obj[k]; return; }
      if (typeof obj[k] === typeof DEFAULTS[k]) out[k] = obj[k];
    });
    if (out.numPlayers !== undefined) out.numPlayers = clamp(Math.round(out.numPlayers), 1, MAX_PLAYERS);
    return out;
  }
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) Object.assign(settings, sanitize(JSON.parse(raw)));
      else {
        const old = localStorage.getItem(OLD_STORE);
        if (old) {
          // carry over settings from the original clock
          const o = JSON.parse(old);
          const m = sanitize(o);
          if (o.turnMode === "rotation") m.turnMode = "clockwise";
          if (o.incrementSeconds > 0) { m.timing = "increment"; m.increment = o.incrementSeconds; }
          if (o.flip) m.layout = "table";
          if (o.light) m.theme = "paper";
          Object.assign(settings, m);
        }
      }
    } catch (_) {}
    ensurePlayers();
  }
  let saveTimer = 0;
  function saveSettings() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(settings)); } catch (_) {} }, 150);
  }

  function loadCustomPresets() {
    try { const a = JSON.parse(localStorage.getItem(PRESET_STORE) || "[]"); return Array.isArray(a) ? a : []; } catch (_) { return []; }
  }
  function saveCustomPresets(list) { try { localStorage.setItem(PRESET_STORE, JSON.stringify(list)); } catch (_) {} }

  // ------------------------------------------------------------------
  // formatting
  // ------------------------------------------------------------------

  function fmt(ms, opts) {
    opts = opts || {};
    const neg = ms < 0;
    const abs = Math.abs(ms);
    if (opts.tenths && abs < 20000 && !neg) {
      const t = Math.floor(abs / 100);
      return { text: Math.floor(t / 10) + "." + (t % 10), tenths: true };
    }
    const total = opts.floor ? Math.floor(abs / 1000) : Math.ceil(abs / 1000);
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    const body = h > 0 ? h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") : m + ":" + String(s).padStart(2, "0");
    return { text: (neg ? "+" : "") + body };
  }
  const fmtPlain = (ms) => fmt(ms, { floor: true }).text;
  function baseLabel(s) {
    s = s || settings;
    if (s.timing === "countup") return "Stopwatch";
    if (s.perPlayerTimes) return "Handicap times";
    const m = s.baseMinutes, sec = s.baseSeconds;
    let t = sec ? m + ":" + String(sec).padStart(2, "0") : m + " min";
    if (s.timing === "increment") t += " + " + s.increment + "s";
    if (s.timing === "delay") t += ", " + s.increment + "s delay";
    if (s.timing === "bronstein") t += ", " + s.increment + "s Bronstein";
    if (s.timing === "hourglass") t += " hourglass";
    if (s.timing === "byoyomi") t += " + " + s.byoPeriods + "×" + s.byoSeconds + "s";
    return t;
  }

  // ------------------------------------------------------------------
  // theme / font
  // ------------------------------------------------------------------

  function applyLook() {
    const html = document.documentElement;
    html.dataset.theme = settings.theme;
    html.dataset.font = settings.font;
    html.dataset.progress = settings.progress;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(html).getPropertyValue("--bg").trim() || "#07090f";
  }

  // ------------------------------------------------------------------
  // audio / voice / haptics
  // ------------------------------------------------------------------

  let actx = null;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; } }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function tone(freq, dur, opts) {
    const a = audio(); if (!a) return;
    opts = opts || {};
    const vol = (settings.volume / 100) * (opts.vol || 0.25);
    if (vol <= 0) return;
    const t0 = a.currentTime + (opts.at || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = opts.wave || "sine";
    o.frequency.setValueAtTime(freq, t0);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const PACKS = {
    classic: {
      switch: () => tone(880, 0.09, { vol: 0.22 }),
      tick: () => tone(1320, 0.04, { vol: 0.12 }),
      warn: () => { tone(660, 0.12, { vol: 0.25 }); tone(660, 0.12, { vol: 0.25, at: 0.16 }); },
      buzz: () => { tone(220, 0.5, { wave: "sawtooth", vol: 0.18 }); tone(165, 0.6, { wave: "sawtooth", vol: 0.18, at: 0.05 }); },
      start: () => { tone(660, 0.1, { vol: 0.2 }); tone(990, 0.16, { vol: 0.2, at: 0.1 }); },
      win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, { vol: 0.2, at: i * 0.11 })),
      pass: () => tone(520, 0.08, { vol: 0.2 }),
    },
    soft: {
      switch: () => tone(523, 0.18, { wave: "triangle", vol: 0.3 }),
      tick: () => tone(880, 0.05, { wave: "triangle", vol: 0.12 }),
      warn: () => tone(440, 0.35, { wave: "triangle", vol: 0.3 }),
      buzz: () => { tone(330, 0.7, { wave: "triangle", vol: 0.3 }); tone(262, 0.9, { wave: "triangle", vol: 0.3, at: 0.25 }); },
      start: () => { tone(392, 0.2, { wave: "triangle", vol: 0.25 }); tone(523, 0.3, { wave: "triangle", vol: 0.25, at: 0.12 }); },
      win: () => [392, 494, 587, 784].forEach((f, i) => tone(f, 0.4, { wave: "triangle", vol: 0.25, at: i * 0.14 })),
      pass: () => tone(392, 0.14, { wave: "triangle", vol: 0.25 }),
    },
    arcade: {
      switch: () => { tone(988, 0.05, { wave: "square", vol: 0.1 }); tone(1319, 0.07, { wave: "square", vol: 0.1, at: 0.05 }); },
      tick: () => tone(1760, 0.025, { wave: "square", vol: 0.06 }),
      warn: () => [0, 0.09, 0.18].forEach((t) => tone(880, 0.06, { wave: "square", vol: 0.1, at: t })),
      buzz: () => tone(440, 0.8, { wave: "square", vol: 0.12, to: 55 }),
      start: () => [523, 784, 1047].forEach((f, i) => tone(f, 0.08, { wave: "square", vol: 0.1, at: i * 0.07 })),
      win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.1, { wave: "square", vol: 0.1, at: i * 0.09 })),
      pass: () => tone(660, 0.06, { wave: "square", vol: 0.1 }),
    },
    wood: {
      switch: () => tone(1900, 0.06, { vol: 0.35, to: 700 }),
      tick: () => tone(2400, 0.03, { vol: 0.15, to: 1200 }),
      warn: () => { tone(1400, 0.07, { vol: 0.3, to: 600 }); tone(1400, 0.07, { vol: 0.3, to: 600, at: 0.12 }); },
      buzz: () => [0, 0.14, 0.28].forEach((t) => tone(900, 0.1, { vol: 0.35, to: 300, at: t })),
      start: () => { tone(1600, 0.05, { vol: 0.3, to: 700 }); tone(2100, 0.06, { vol: 0.3, to: 900, at: 0.09 }); },
      win: () => [0, 0.1, 0.2, 0.36].forEach((t, i) => tone(1200 + i * 300, 0.08, { vol: 0.3, to: 600, at: t })),
      pass: () => tone(1700, 0.05, { vol: 0.3, to: 800 }),
    },
  };
  function sfx(name) {
    if (!settings.soundEnabled) return;
    try { (PACKS[settings.soundPack] || PACKS.classic)[name](); } catch (_) {}
  }
  function say(text) {
    if (!settings.voiceEnabled || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.08; u.volume = clamp(settings.volume / 100, 0.1, 1);
      speechSynthesis.speak(u);
    } catch (_) {}
  }
  function buzz(pattern) {
    if (!settings.vibrate || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (_) {}
  }

  // ------------------------------------------------------------------
  // toasts, modal, confetti
  // ------------------------------------------------------------------

  function toast(msg, ic) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = (ic ? icon(ic) : "") + "<span></span>";
    el.querySelector("span").textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(() => { el.classList.add("bye"); setTimeout(() => el.remove(), 320); }, 2200);
  }

  const modal = $("#modal"), modalCard = $("#modalCard");
  let modalOnClose = null;
  function openModal(html, opts) {
    opts = opts || {};
    modalCard.className = "modal-card" + (opts.wide ? " wide" : "");
    modalCard.innerHTML = html;
    modal.classList.remove("hidden");
    modalOnClose = opts.onClose || null;
    $$("[data-close]", modal).forEach((b) => (b.onclick = closeModal));
    return modalCard;
  }
  function closeModal() {
    if (modal.classList.contains("hidden")) return;
    modal.classList.add("hidden");
    modalCard.innerHTML = "";
    const cb = modalOnClose; modalOnClose = null;
    if (cb) cb();
  }
  const modalOpen = () => !modal.classList.contains("hidden");
  const mHead = (title, ic) => `<div class="m-head"><h3>${ic ? icon(ic) : ""}${title}</h3><button class="m-close" data-close aria-label="Close">${icon("close")}</button></div>`;

  function confetti(colors) {
    const cv = $("#confetti"), ctx = cv.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const parts = Array.from({ length: 180 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.38,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 5,
      r: Math.random() * 6 + 4, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.4,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const t0 = performance.now();
    (function frame(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.globalAlpha = Math.max(0, 1 - t / 3200);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if (t < 3200) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  // ------------------------------------------------------------------
  // setup screen
  // ------------------------------------------------------------------

  const setupEl = $("#setup"), gameEl = $("#game");

  function evalShow(expr) {
    return expr.split("&").every((raw) => {
      let part = raw.trim(), neg = false;
      if (part.startsWith("!")) { neg = true; part = part.slice(1); }
      let res;
      const ne = part.indexOf("!="), eq = part.indexOf("=");
      if (ne > 0) res = !part.slice(ne + 2).split("|").includes(String(settings[part.slice(0, ne)]));
      else if (eq > 0) res = part.slice(eq + 1).split("|").includes(String(settings[part.slice(0, eq)]));
      else res = !!settings[part];
      return neg ? !res : res;
    });
  }

  function syncSetup() {
    $$("[data-bind]").forEach((el) => {
      const v = settings[el.dataset.bind];
      if (el.classList.contains("seg")) {
        $$("button[data-v]", el).forEach((b) => { const on = b.dataset.v === String(v); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      } else if (el.type === "checkbox") el.checked = !!v;
      else if (el !== document.activeElement) el.value = el.dataset.bind === "baseSeconds" ? String(v).padStart(2, "0") : v;
      if (el.type === "range") el.style.setProperty("--fillp", v + "%");
    });
    $$("[data-step]").forEach((st) => {
      const k = st.dataset.step, v = settings[k];
      $("output", st).textContent = v;
      const [minus, plus] = $$("button", st);
      minus.disabled = v <= Number(st.dataset.min);
      plus.disabled = v >= Number(st.dataset.max);
    });
    $$("[data-show]").forEach((el) => el.classList.toggle("hidden", !evalShow(el.dataset.show)));
    $("#timingExplain").innerHTML = TIMING_TEXT[settings.timing] || "";
    $("#turnExplain").textContent = TURN_TEXT[settings.turnMode] || "";
    $("#layoutExplain").textContent = LAYOUT_TEXT[settings.layout] || "";
    $("#incLabel").textContent = settings.timing === "delay" ? "Delay" : settings.timing === "bronstein" ? "Max refund" : "Increment";
    $$("#quickTimes button").forEach((b) => b.classList.toggle("on", Number(b.dataset.m) === settings.baseMinutes && settings.baseSeconds === 0));
    $$(".theme-opt").forEach((b) => b.classList.toggle("on", b.dataset.v === settings.theme));
    $$(".font-opt").forEach((b) => b.classList.toggle("on", b.dataset.v === settings.font));
    renderSummary();
    markPreset();
    renderPreview();
  }

  function renderSummary() {
    const n = settings.numPlayers;
    const order = { clockwise: "in order", counter: "reverse order", snake: "snake order", free: "free order" }[settings.turnMode];
    const extras = [];
    if (settings.moveLimitEnabled) extras.push(settings.moveLimit + "s move limit");
    if (settings.passEnabled) extras.push(settings.passLabel + " button");
    if (settings.atZero === "overtime" && settings.timing !== "countup") extras.push("overtime");
    $("#summary").innerHTML = `<b>${n} player${n > 1 ? "s" : ""} · ${esc(baseLabel())}</b> <span>${order}${extras.length ? " · " + esc(extras.join(" · ")) : ""}</span>`;
  }

  function setSetting(key, value, opts) {
    opts = opts || {};
    settings[key] = value;
    if (key === "numPlayers") { ensurePlayers(); renderPlayerList(); }
    if (key === "perPlayerTimes") {
      if (value) settings.players.forEach((p) => { p.minutes = settings.baseMinutes; p.seconds = settings.baseSeconds; });
      renderPlayerList();
    }
    if (key === "theme" || key === "font" || key === "progress") applyLook();
    if (key === "soundEnabled" && value) setTimeout(() => sfx("switch"), 30);
    if (key === "soundPack") setTimeout(() => sfx("switch"), 30);
    if (key === "voiceEnabled" && value) say("Voice announcer on");
    saveSettings();
    if (!opts.quiet) syncSetup();
  }

  function bindSetup() {
    $$("[data-bind]").forEach((el) => {
      const key = el.dataset.bind;
      const kind = typeof DEFAULTS[key];
      if (el.classList.contains("seg")) {
        el.addEventListener("click", (e) => {
          const b = e.target.closest("button[data-v]"); if (!b) return;
          setSetting(key, kind === "number" ? Number(b.dataset.v) : b.dataset.v);
        });
      } else if (el.type === "checkbox") {
        el.addEventListener("change", () => setSetting(key, el.checked));
      } else if (el.type === "number" || el.type === "range") {
        const commit = (final) => {
          if (el.value === "" && !final) return;
          const min = el.min !== "" ? Number(el.min) : -Infinity, max = el.max !== "" ? Number(el.max) : Infinity;
          const v = clamp(Math.round(Number(el.value) || 0), min, max);
          setSetting(key, v, { quiet: !final });
          if (final) el.value = v;
          else { renderSummary(); markPreset(); renderPreview(); if (el.type === "range") el.style.setProperty("--fillp", v + "%"); }
        };
        el.addEventListener("input", () => commit(false));
        el.addEventListener("change", () => commit(true));
        el.addEventListener("focus", () => el.select && el.select());
      } else {
        el.addEventListener("input", () => { setSetting(key, el.value || DEFAULTS[key], { quiet: true }); renderSummary(); });
      }
    });
    $$("[data-step]").forEach((st) => {
      st.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-d]"); if (!b) return;
        const k = st.dataset.step;
        const v = clamp(settings[k] + Number(b.dataset.d), Number(st.dataset.min), Number(st.dataset.max));
        if (v !== settings[k]) setSetting(k, v);
      });
    });

    const qt = $("#quickTimes");
    [1, 3, 5, 10, 15, 30, 60, 90].forEach((m) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip-btn"; b.dataset.m = m;
      b.textContent = m < 60 ? m + "m" : m / 60 + (m % 60 ? ".5" : "") + "h";
      b.onclick = () => { settings.baseSeconds = 0; setSetting("baseMinutes", m); };
      qt.appendChild(b);
    });

    const th = $("#themes");
    THEMES.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "theme-opt"; b.dataset.v = t.id;
      b.innerHTML = `<div class="theme-sw" style="background:${t.sw[0]}"><span style="background:${t.sw[1]}"></span><span style="background:${t.sw[2]}"></span><span style="background:${t.sw[1]};opacity:.45"></span></div><b>${t.name}</b>`;
      b.onclick = () => setSetting("theme", t.id);
      th.appendChild(b);
    });
    const fo = $("#fonts");
    FONTS.forEach((f) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "font-opt"; b.dataset.v = f.id;
      b.innerHTML = `<span class="fs" data-font="${f.id}" style="font-family:var(--clock-font);font-weight:var(--clock-weight);letter-spacing:var(--clock-track)">4:59</span><small>${f.name}</small>`;
      b.onclick = () => setSetting("font", f.id);
      fo.appendChild(b);
    });

    $("#themeQuick").onclick = () => {
      const i = THEMES.findIndex((t) => t.id === settings.theme);
      const next = THEMES[(i + 1) % THEMES.length];
      setSetting("theme", next.id);
      toast(next.name + " theme", "palette");
    };
    $("#helpBtn").onclick = showShortcuts;
    $("#testSound").onclick = () => { sfx("switch"); setTimeout(() => sfx("warn"), 350); setTimeout(() => sfx("buzz"), 900); };
    $("#shuffleBtn").onclick = () => {
      const a = settings.players;
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      saveSettings(); renderPlayerList(); syncSetup(); toast("Seats shuffled", "shuffle");
    };
    $("#resetNamesBtn").onclick = () => {
      settings.players.forEach((p, i) => { p.name = NAMES[i]; p.color = PALETTE[i % PALETTE.length]; });
      saveSettings(); renderPlayerList(); syncSetup();
    };
    $("#savePresetBtn").onclick = savePresetDialog;
    $("#shareBtn").onclick = shareLink;
    $("#resetBtn").onclick = () => {
      openModal(mHead("Reset everything?", "trash") +
        `<p class="explain" style="margin:0 0 16px">This resets all settings and player names to the defaults. Your saved presets stay.</p>
         <div class="m-actions"><button class="btn" data-close>Cancel</button><button class="btn danger" id="doReset">${icon("trash")} Reset</button></div>`);
      $("#doReset").onclick = () => {
        settings = clone(DEFAULTS); ensurePlayers(); saveSettings(); applyLook(); renderPlayerList(); syncSetup(); closeModal(); toast("Back to defaults", "check");
      };
    };
    $("#startBtn").onclick = () => { audio(); startNewGame(); };
    $("#resumeBtn").onclick = () => { audio(); resumeSaved(); };
    $("#discardBtn").onclick = () => { clearSavedGame(); game = null; updateResumeCard(); toast("Game discarded"); };
  }

  // players list -------------------------------------------------------
  let paletteOpen = -1;
  function renderPlayerList() {
    const list = $("#playerList");
    list.innerHTML = "";
    settings.players.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "p-row";
      row.style.setProperty("--pc", p.color);
      row.style.animationDelay = i * 0.03 + "s";
      row.innerHTML = `<span class="p-seat">${i + 1}</span>
        <button type="button" class="p-swatch" aria-label="Change color"></button>
        <input type="text" maxlength="24" aria-label="Player ${i + 1} name">
        ${settings.perPlayerTimes && settings.timing !== "countup" ? `<span class="p-times"><input type="number" inputmode="numeric" min="0" max="999" class="pm" aria-label="Minutes"><i>m</i><input type="number" inputmode="numeric" min="0" max="59" class="ps" aria-label="Seconds"><i>s</i></span>` : ""}`;
      const name = $("input[type=text]", row);
      name.value = p.name;
      name.placeholder = NAMES[i];
      name.addEventListener("input", () => { p.name = name.value; saveSettings(); renderPreview(); });
      name.addEventListener("blur", () => { if (!p.name.trim()) { p.name = NAMES[i]; name.value = p.name; saveSettings(); renderPreview(); } });
      const pm = $(".pm", row), ps = $(".ps", row);
      if (pm) {
        pm.value = p.minutes; ps.value = p.seconds;
        pm.addEventListener("input", () => { p.minutes = clamp(Math.round(Number(pm.value) || 0), 0, 999); saveSettings(); renderPreview(); });
        ps.addEventListener("input", () => { p.seconds = clamp(Math.round(Number(ps.value) || 0), 0, 59); saveSettings(); renderPreview(); });
        pm.addEventListener("change", () => (pm.value = p.minutes));
        ps.addEventListener("change", () => (ps.value = p.seconds));
      }
      $(".p-swatch", row).onclick = () => { paletteOpen = paletteOpen === i ? -1 : i; renderPlayerList(); };
      if (paletteOpen === i) {
        const pal = document.createElement("div");
        pal.className = "p-palette";
        PALETTE.forEach((c) => {
          const b = document.createElement("button");
          b.type = "button"; b.style.setProperty("--c", c); b.setAttribute("aria-label", "Color " + c);
          if (c === p.color) b.className = "on";
          b.onclick = () => {
            // swap with whoever already has this colour so everyone stays distinct
            const other = settings.players.find((q) => q !== p && q.color === c);
            if (other) other.color = p.color;
            p.color = c; paletteOpen = -1; saveSettings(); renderPlayerList(); renderPreview();
          };
          pal.appendChild(b);
        });
        row.appendChild(pal);
      }
      list.appendChild(row);
    });
  }

  // presets ------------------------------------------------------------
  function presetMatches(s) {
    const full = Object.assign({}, PRESET_BASE, s);
    return Object.keys(full).every((k) => settings[k] === full[k]);
  }
  function markPreset() {
    $$(".preset").forEach((el) => {
      const p = el._preset;
      el.classList.toggle("on", !!p && presetMatches(p.s));
    });
  }
  function applyPreset(p) {
    const s = Object.assign({}, PRESET_BASE, clone(p.s));
    const players = s.players; delete s.players;
    Object.assign(settings, s);
    if (players) settings.players = players;
    ensurePlayers();
    if (!settings.perPlayerTimes) settings.players.forEach((q) => { q.minutes = settings.baseMinutes; q.seconds = settings.baseSeconds; });
    saveSettings(); renderPlayerList(); syncSetup();
    sfx("switch");
  }
  function renderPresets() {
    const box = $("#presets");
    box.innerHTML = "";
    const custom = loadCustomPresets();
    const all = PRESETS.concat(custom.map((c) => Object.assign({ custom: true, e: "⭐" }, c)));
    all.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "preset"; b._preset = p;
      b.innerHTML = `<span class="pe">${p.e}</span><span class="pn">${esc(p.name)}</span><span class="ps">${esc(p.sub || "")}</span>` +
        (p.custom ? `<span class="pdel" role="button" aria-label="Delete preset">${icon("close")}</span>` : "");
      b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.setProperty("--mx", e.clientX - r.left + "px"); b.style.setProperty("--my", e.clientY - r.top + "px"); });
      b.onclick = (e) => {
        if (e.target.closest(".pdel")) {
          saveCustomPresets(loadCustomPresets().filter((c) => c.id !== p.id));
          renderPresets(); toast("Preset deleted", "trash");
          return;
        }
        applyPreset(p);
        toast(p.name + " loaded", "bolt");
      };
      box.appendChild(b);
    });
    markPreset();
  }
  function savePresetDialog() {
    openModal(mHead("Save as preset", "star") + `
      <div class="m-section"><div class="m-label">Name</div><input class="m-input" id="presetName" maxlength="28" placeholder="Friday poker night"></div>
      <p class="explain" style="margin-top:0">Saves the rules, player names and colours: ${esc(settings.numPlayers + " players · " + baseLabel())}.</p>
      <div class="m-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="presetSave">${icon("check")} Save preset</button></div>`);
    const inp = $("#presetName");
    setTimeout(() => inp.focus(), 50);
    const save = () => {
      const name = inp.value.trim() || "My preset";
      const s = {}; RULE_KEYS.forEach((k) => (s[k] = settings[k]));
      s.players = clone(settings.players);
      const list = loadCustomPresets();
      list.push({ id: "c" + Date.now(), name, sub: settings.numPlayers + "p · " + baseLabel(), s });
      saveCustomPresets(list);
      closeModal(); renderPresets(); toast("Preset saved", "star");
    };
    $("#presetSave").onclick = save;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
  }

  // share links ---------------------------------------------------------
  function encodeShare() {
    const s = {}; RULE_KEYS.forEach((k) => (s[k] = settings[k]));
    s.players = settings.players.map((p) => ({ name: p.name, color: p.color, minutes: p.minutes, seconds: p.seconds }));
    const bytes = new TextEncoder().encode(JSON.stringify(s));
    let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodeShare(str) {
    const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  async function shareLink() {
    const url = location.origin + location.pathname + "#s=" + encodeShare();
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) { await navigator.share({ title: "Game clock", url }); return; }
      await navigator.clipboard.writeText(url);
      toast("Link copied", "link");
    } catch (_) {
      openModal(mHead("Share link", "link") + `<input class="m-input" readonly value="${esc(url)}" onfocus="this.select()">`);
    }
  }
  function importFromHash() {
    const m = location.hash.match(/^#s=([A-Za-z0-9_-]+)/);
    if (!m) return;
    try {
      const s = sanitize(decodeShare(m[1]));
      const keep = {}; RULE_KEYS.concat(["players"]).forEach((k) => { if (s[k] !== undefined) keep[k] = s[k]; });
      Object.assign(settings, keep);
      ensurePlayers(); saveSettings();
      setTimeout(() => toast("Settings loaded from link", "link"), 300);
    } catch (_) {
      setTimeout(() => toast("That share link is broken"), 300);
    }
    history.replaceState(null, "", location.pathname);
  }

  // live preview in the hero ---------------------------------------------
  const preview = $("#preview");
  let pvActive = 0, pvTimer = 0, pvElapsed = 0;
  function previewRows() {
    return layoutRows(settings.numPlayers, settings.layout, preview.clientWidth || 400, preview.clientHeight || 250);
  }
  function renderPreview() {
    const n = settings.numPlayers;
    if (pvActive >= n) pvActive = 0;
    const rows = previewRows();
    preview.innerHTML = "";
    rows.forEach((r) => {
      const row = document.createElement("div");
      row.className = "pv-row";
      r.idx.forEach((i) => {
        const p = settings.players[i];
        const t = document.createElement("div");
        t.className = "pv-tile" + (r.flip ? " flip" : "") + (i === pvActive ? " on" : "");
        t.style.setProperty("--pc", p.color);
        const start = startMsFor(p, settings);
        let ms = start;
        if (i === pvActive) ms = settings.timing === "countup" ? pvElapsed : Math.max(0, start - pvElapsed);
        const pct = settings.timing === "countup" || start <= 0 ? 0 : clamp(ms / start, 0, 1);
        t.innerHTML = `<div class="pv-fill" style="height:${settings.progress === "none" ? 0 : pct * 100}%"></div><div class="pv-name"></div><div class="pv-time">${fmt(ms).text}</div>`;
        $(".pv-name", t).textContent = p.name || NAMES[i];
        row.appendChild(t);
      });
      preview.appendChild(row);
    });
  }
  function startPreviewLoop() {
    clearInterval(pvTimer);
    pvTimer = setInterval(() => {
      if (setupEl.classList.contains("hidden") || document.hidden) return;
      pvElapsed += 1000;
      if (pvElapsed >= 4000) { pvElapsed = 0; pvActive = (pvActive + 1) % settings.numPlayers; }
      renderPreview();
    }, 1000);
  }

  // ------------------------------------------------------------------
  // layout
  // ------------------------------------------------------------------

  // Returns rows of player indices, e.g. [{idx:[2,3], flip:true}, {idx:[1,0], flip:false}]
  function layoutRows(n, mode, W, H) {
    const all = Array.from({ length: n }, (_, i) => i);
    if (n === 1) return [{ idx: [0], flip: false }];
    if (mode === "stack") return all.map((i) => ({ idx: [i], flip: false }));
    if (mode === "table") {
      // bottom row seats players right→left, far row continues left→right, so play goes clockwise around the table
      const b = Math.ceil(n / 2);
      const bottom = all.slice(0, b).reverse();
      const top = all.slice(b);
      return [{ idx: top, flip: true }, { idx: bottom, flip: false }];
    }
    let best = 1, bestScore = -1;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      if (c > 1 && (c - 1) * r >= n) continue; // skip column counts that leave a whole empty column
      const score = Math.min(W / c / 1.5, H / r);
      if (score > bestScore + 0.5) { bestScore = score; best = c; }
    }
    const rows = [];
    for (let i = 0; i < n; i += best) rows.push({ idx: all.slice(i, i + best), flip: false });
    return rows;
  }

  // ------------------------------------------------------------------
  // game engine
  // ------------------------------------------------------------------

  let game = null;
  let rafId = 0, lastNow = null, lastSwitchAt = 0, saveTick = 0;

  function startMsFor(p, s) {
    if (s.timing === "countup") return 0;
    const sec = s.perPlayerTimes ? p.minutes * 60 + p.seconds : s.baseMinutes * 60 + s.baseSeconds;
    return sec * 1000;
  }

  function buildGame() {
    ensurePlayers();
    const C = clone(settings);
    delete C.players;
    const players = settings.players.map((p, i) => {
      const start = startMsFor(p, settings);
      return {
        name: (p.name || "").trim() || NAMES[i], color: p.color, start, remaining: start, peak: start,
        out: false, overtime: false, passUses: settings.passMaxUses, moves: 0, used: 0, longest: 0, turn: 0,
        byo: C.timing === "byoyomi" ? C.byoPeriods : 0, inByo: false, limitHit: false, lowWarned: false, lastWhole: null,
      };
    });
    const g = { v: 2, cfg: C, players, active: 0, dir: C.turnMode === "counter" ? -1 : 1, round: 1, firstPlayer: 0,
      state: "ready", elapsed: 0, totalMoves: 0, outOrder: [], history: [], endedBy: null };
    // starting with zero main time
    players.forEach((p, i) => {
      if (C.timing === "countup" || p.start > 0) return;
      if (C.timing === "byoyomi") { p.inByo = true; p.remaining = C.byoSeconds * 1000; p.peak = p.remaining; }
      else if (C.atZero === "stop") { p.out = true; g.outOrder.push(i); }
    });
    const alive = players.map((_, i) => i).filter((i) => !players[i].out);
    if (!alive.length) return null;
    g.active = C.startPlayer === "random" ? alive[Math.floor(Math.random() * alive.length)] : alive[0];
    g.firstPlayer = g.active;
    return g;
  }

  const aliveIdx = () => game.players.map((_, i) => i).filter((i) => !game.players[i].out);

  function nextIndex(i) {
    const n = game.players.length, C = game.cfg, P = game.players;
    if (!aliveIdx().length) return -1;
    if (C.turnMode === "snake") {
      let j = i, d = game.dir;
      for (let k = 0; k < 4 * n + 2; k++) {
        let c = j + d, bounced = false;
        if (c < 0 || c >= n) { d = -d; c = j; bounced = true; game.round++; }
        j = c;
        // the end seat plays twice in a row (1 2 3 3 2 1), so i itself is fine right after a bounce
        if (!P[j].out && (j !== i || bounced)) { game.dir = d; return j; }
      }
      return i;
    }
    const d = C.turnMode === "counter" ? -1 : 1;
    const pos = (c) => (((c - game.firstPlayer) * d) % n + n) % n;
    for (let k = 1; k <= n; k++) {
      const c = (((i + d * k) % n) + n) % n;
      if (!P[c].out) {
        if (pos(c) <= pos(i)) game.round++;
        return c;
      }
    }
    return i;
  }

  function pushHistory() {
    game.history.push(JSON.stringify({ players: game.players, active: game.active, dir: game.dir, round: game.round,
      totalMoves: game.totalMoves, outOrder: game.outOrder }));
    if (game.history.length > 60) game.history.shift();
  }

  function undo() {
    if (!game || !game.history.length) { toast("Nothing to undo"); return; }
    const snap = JSON.parse(game.history.pop());
    Object.assign(game, snap);
    if (game.state === "over") { game.state = "paused"; game.endedBy = null; }
    lastSwitchAt = performance.now();
    renderBoard(); updateUI(); saveGame();
    toast("Turn undone", "undo");
    sfx("pass");
  }

  function setActive(i) {
    game.active = i;
    if (i >= 0) { const p = game.players[i]; p.turn = 0; p.limitHit = false; }
  }

  function announceTurn() {
    if (game.active < 0 || game.players.length < 2) return;
    say(game.players[game.active].name);
  }

  function endTurn(opts) {
    opts = opts || {};
    const i = game.active;
    if (i < 0 || game.state !== "running") return;
    pushHistory();
    const C = game.cfg, p = game.players[i];
    if (!p.out) {
      if (C.timing === "increment") p.remaining += C.increment * 1000;
      else if (C.timing === "bronstein") p.remaining += Math.min(p.turn, C.increment * 1000);
      if (C.timing === "byoyomi" && p.inByo) p.remaining = C.byoSeconds * 1000;
      p.peak = Math.max(p.peak, p.remaining);
      if (p.remaining > C.lowTimeThreshold * 1000) p.lowWarned = false;
    }
    p.moves++; game.totalMoves++;
    p.longest = Math.max(p.longest, p.turn);
    p.turn = 0;
    const next = opts.to != null ? opts.to : nextIndex(i);
    setActive(next);
    lastSwitchAt = performance.now();
    sfx("switch"); buzz(18);
    announceTurn();
    bumpPanel(next);
    updateUI(); saveGame();
  }

  function eliminate(i, reason) {
    const p = game.players[i];
    if (p.out) return;
    p.out = true;
    if (p.remaining < 0 && game.cfg.atZero !== "overtime") p.remaining = 0;
    game.outOrder.push(i);
    sfx("buzz"); buzz([200, 80, 200]);
    say(p.name + (reason === "limit" ? ", move limit" : ", time"));
    toast(p.name + (reason === "limit" ? " hit the move limit" : reason === "manual" ? " is out" : " ran out of time"), "flag");
    const alive = aliveIdx();
    if (alive.length === 0 || (game.players.length > 1 && alive.length === 1)) { finishGame("timeout"); return; }
    if (game.active === i) {
      if (game.cfg.turnMode === "free") setActive(-1);
      else { const nx = nextIndex(i); setActive(nx); announceTurn(); }
    }
    renderBoard(); updateUI(); saveGame();
  }

  function advance(dt) {
    const C = game.cfg;
    game.elapsed += dt;
    const i = game.active;
    if (i < 0) return;
    const p = game.players[i];
    if (p.out) return;
    const prevTurn = p.turn;
    p.turn += dt; p.used += dt;

    switch (C.timing) {
      case "countup": p.remaining += dt; break;
      case "delay": {
        const d = C.increment * 1000;
        p.remaining -= Math.max(0, p.turn - d) - Math.max(0, prevTurn - d);
        break;
      }
      case "hourglass": {
        p.remaining -= dt;
        const others = aliveIdx().filter((j) => j !== i);
        others.forEach((j) => { const q = game.players[j]; q.remaining += dt / others.length; q.peak = Math.max(q.peak, q.remaining); });
        break;
      }
      default: p.remaining -= dt;
    }

    if (C.moveLimitEnabled && !p.limitHit && p.turn >= C.moveLimit * 1000) {
      p.limitHit = true;
      if (C.moveLimitAction === "out") { eliminate(i, "limit"); return; }
      if (C.moveLimitAction === "pass") { toast(p.name + "'s turn timed out", "clock"); sfx("warn"); endTurn(); return; }
      sfx("warn"); buzz([80, 60, 80]); say("Move time");
      flashPanel(i);
    }

    if (C.timing === "countup") return;

    // warnings
    const thr = settings.lowTimeThreshold * 1000;
    if (p.remaining > 0) {
      if (settings.lowTimeEnabled && !p.lowWarned && p.remaining <= thr && !p.inByo) {
        p.lowWarned = true; sfx("warn"); buzz([60, 40, 60]);
        say(Math.ceil(p.remaining / 1000) + " seconds");
      }
      const whole = Math.ceil(p.remaining / 1000);
      if (whole !== p.lastWhole) {
        if (p.lastWhole != null && settings.tickLast && settings.lowTimeEnabled && whole < p.lastWhole && p.remaining <= Math.min(thr, 10000)) sfx("tick");
        p.lastWhole = whole;
      }
    }

    if (p.remaining <= 0) {
      if (C.timing === "byoyomi" && (p.byo > 1 || (!p.inByo && p.byo > 0))) {
        if (!p.inByo) { p.inByo = true; toast(p.name + " is in byo-yomi", "clock"); say("Byo-yomi"); }
        else { p.byo--; toast(p.name + ": " + p.byo + " period" + (p.byo === 1 ? "" : "s") + " left", "clock"); say(p.byo + " left"); }
        p.remaining += C.byoSeconds * 1000;
        p.peak = C.byoSeconds * 1000;
        sfx("warn"); buzz([100, 50, 100]);
        renderBoard();
      } else if (C.atZero === "overtime" && C.timing !== "byoyomi") {
        if (!p.overtime) { p.overtime = true; sfx("buzz"); buzz([300]); say(p.name + ", overtime"); }
      } else {
        if (C.timing === "byoyomi") p.byo = 0;
        p.remaining = 0;
        eliminate(i, "time");
      }
    }
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (lastNow == null) lastNow = now;
    const dt = Math.min(now - lastNow, 6 * 3600 * 1000);
    lastNow = now;
    if (!game) return;
    if (game.state === "running" && !(passState && game.cfg.passPauses)) {
      advance(dt);
      if (now - saveTick > 1000) { saveTick = now; saveGame(); }
    }
    updateUI();
  }
  function startLoop() { cancelAnimationFrame(rafId); lastNow = null; rafId = requestAnimationFrame(loop); }
  function stopLoop() { cancelAnimationFrame(rafId); rafId = 0; }

  function startClock() {
    if (!game || game.state !== "ready") return;
    game.state = "running";
    lastSwitchAt = performance.now();
    sfx("start"); buzz(30);
    announceTurn();
    renderBoard(); updateUI(); saveGame();
  }

  function setPaused(paused) {
    if (!game || game.state === "over" || game.state === "ready") return;
    game.state = paused ? "paused" : "running";
    if (!paused) lastSwitchAt = performance.now();
    sfx(paused ? "pass" : "start");
    updateUI(); saveGame();
  }

  function finishGame(by) {
    if (!game) return;
    game.state = "over";
    game.endedBy = by;
    if (game.active >= 0) game.players[game.active].longest = Math.max(game.players[game.active].longest, game.players[game.active].turn);
    renderBoard(); updateUI(); saveGame();
    wake(false);
    setTimeout(showResults, by === "timeout" ? 900 : 100);
  }

  // ------------------------------------------------------------------
  // persistence of the running game
  // ------------------------------------------------------------------

  function saveGame() {
    if (!game) return;
    try { localStorage.setItem(GAME_STORE, JSON.stringify({ game, savedAt: Date.now() })); } catch (_) {}
  }
  function loadSavedGame() {
    try {
      const raw = localStorage.getItem(GAME_STORE);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || !d.game || d.game.v !== 2 || d.game.state === "over" || !Array.isArray(d.game.players)) return null;
      return d;
    } catch (_) { return null; }
  }
  function clearSavedGame() { try { localStorage.removeItem(GAME_STORE); } catch (_) {} }
  function updateResumeCard() {
    const d = loadSavedGame();
    const card = $("#resumeCard");
    if (!d) { card.classList.add("hidden"); return; }
    const g = d.game;
    const ago = Math.round((Date.now() - d.savedAt) / 60000);
    $("#resumeInfo").textContent = `${g.players.length} player${g.players.length > 1 ? "s" : ""} · ${baseLabel(g.cfg)} · ${fmtPlain(g.elapsed)} played · ${ago < 1 ? "just now" : ago < 60 ? ago + " min ago" : Math.round(ago / 60) + " h ago"}`;
    card.classList.remove("hidden");
  }

  // ------------------------------------------------------------------
  // game screen
  // ------------------------------------------------------------------

  const board = $("#board"), dock = $("#dock");
  let panels = [];

  function showGame() {
    setupEl.classList.add("hidden");
    gameEl.classList.remove("hidden");
    window.scrollTo(0, 0);
    renderBoard(); updateUI();
    startLoop();
    wake(true);
    poke();
  }
  function showSetup() {
    stopLoop();
    if (game && game.state === "running") { game.state = "paused"; saveGame(); }
    gameEl.classList.add("hidden");
    setupEl.classList.remove("hidden");
    wake(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    updateResumeCard(); syncSetup();
  }

  function startNewGame() {
    const g = buildGame();
    if (!g) { toast("Every player starts with zero time. Add some time first.", "clock"); return; }
    game = g;
    clearSavedGame();
    showGame();
    saveGame();
  }
  function restartGame() {
    if (!game) return;
    const keepNames = game.players.map((p) => p.name);
    const g = buildGame();
    if (!g) return;
    g.players.forEach((p, i) => (p.name = keepNames[i] || p.name));
    game = g;
    closeModal();
    renderBoard(); updateUI(); saveGame(); wake(true);
    toast("Clocks reset", "restart");
  }
  function resumeSaved() {
    const d = loadSavedGame();
    if (!d) { updateResumeCard(); return; }
    game = d.game;
    if (game.state === "running") game.state = "paused";
    showGame();
  }

  function renderBoard() {
    if (!game) return;
    const n = game.players.length;
    const rows = layoutRows(n, game.cfg.layout, board.clientWidth || innerWidth, board.clientHeight || innerHeight);
    board.innerHTML = "";
    panels = new Array(n);
    rows.forEach((r) => {
      const row = document.createElement("div");
      row.className = "b-row";
      r.idx.forEach((i) => {
        const el = buildPanel(i, r.flip);
        row.appendChild(el);
        panels[i] = el;
      });
      board.appendChild(row);
    });
    const dockPos = settings.dock === "auto" ? (n === 2 && rows.length === 2 ? "center" : "bottom") : settings.dock;
    dock.classList.toggle("center", dockPos === "center");
    updateUI(true);
  }

  function buildPanel(i, flip) {
    const p = game.players[i];
    const el = document.createElement("div");
    el.className = "panel" + (flip ? " flip" : "");
    el.style.setProperty("--pc", p.color);
    el.innerHTML = `
      <div class="fill"></div>
      <div class="bar"><i></i></div>
      <svg class="ring" viewBox="0 0 100 100"><circle class="rt" cx="50" cy="50" r="47" pathLength="100"/><circle class="rb" cx="50" cy="50" r="47" pathLength="100"/></svg>
      ${game.players.length > 2 ? `<span class="p-seatno">${i + 1}</span>` : ""}
      <div class="p-inner">
        <div class="p-head"><span class="dot"></span><span class="nm"></span></div>
        <div class="p-time"></div>
        <div class="p-meta"></div>
        ${game.cfg.passEnabled ? `<button class="p-pass" type="button"></button>` : ""}
      </div>
      <button class="p-menu" type="button" aria-label="Player options">${icon("dots")}</button>`;
    $(".nm", el).textContent = p.name;
    el._time = $(".p-time", el);
    el._meta = $(".p-meta", el);
    el._pass = $(".p-pass", el);
    el._last = {};
    el.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || e.target.closest(".p-menu, .p-pass")) return;
      e.preventDefault();
      ripple(el, e, flip);
      onPanelTap(i);
    });
    $(".p-menu", el).addEventListener("click", (e) => { e.stopPropagation(); playerMenu(i); });
    if (el._pass) el._pass.addEventListener("click", (e) => { e.stopPropagation(); triggerPass(i); });
    return el;
  }

  function ripple(el, e, flip) {
    const r = el.getBoundingClientRect();
    let x = e.clientX - r.left, y = e.clientY - r.top;
    if (flip) { x = r.width - x; y = r.height - y; }
    const d = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `left:${x}px;top:${y}px;width:${d}px;height:${d}px`;
    el.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }
  function bumpPanel(i) {
    const el = panels[i]; if (!el) return;
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }
  function flashPanel(i) {
    const el = panels[i]; if (!el) return;
    el.classList.remove("limit-flash"); void el.offsetWidth; el.classList.add("limit-flash");
  }

  function onPanelTap(i) {
    audio();
    poke();
    if (!game || modalOpen() || passState) return;
    const C = game.cfg, P = game.players;
    if (game.state === "over") { showResults(); return; }
    if (game.state === "paused") return;
    if (performance.now() - lastSwitchAt < 220) return; // guard against double taps
    if (game.state === "ready") {
      if (C.turnMode === "free" && !P[i].out) setActive(i);
      startClock();
      return;
    }
    if (C.turnMode === "free") {
      if (P[i].out || i === game.active) return;
      if (game.active >= 0) endTurn({ to: i });
      else { setActive(i); lastSwitchAt = performance.now(); sfx("switch"); buzz(18); announceTurn(); bumpPanel(i); saveGame(); }
      return;
    }
    if (i === game.active || C.tapAnywhere) endTurn();
  }

  function timeView(p, C) {
    if (C.timing === "countup") return fmt(p.remaining, { floor: true });
    if (p.remaining < 0) return fmt(p.remaining, { floor: true });
    return fmt(p.remaining, { tenths: settings.showTenths && p.remaining > 0 });
  }

  function updateUI(force) {
    if (!game) return;
    const C = game.cfg, st = game.state;
    gameEl.classList.toggle("is-running", st === "running");
    for (let i = 0; i < game.players.length; i++) {
      const el = panels[i], p = game.players[i];
      if (!el) continue;
      const active = game.active === i && st !== "over";
      const tv = timeView(p, C);
      const html = tv.tenths ? tv.text.replace(/\.(\d)$/, '<span class="tenth">.$1</span>') : tv.text;
      if (force || el._last.html !== html) {
        el._time.innerHTML = html;
        el._time.dataset.len = tv.text.length;
        el._last.html = html;
      }
      const low = !p.out && C.timing !== "countup" && settings.lowTimeEnabled && p.remaining > 0 && p.remaining <= settings.lowTimeThreshold * 1000 && active && st === "running";
      el.classList.toggle("active", active && !p.out);
      el.classList.toggle("waiting", st === "ready" && !active);
      el.classList.toggle("out", p.out);
      el.classList.toggle("low", low);
      el.classList.toggle("overtime", p.remaining < 0 && C.timing !== "countup");
      const pct = C.timing === "countup" ? 0 : p.peak > 0 ? clamp(p.remaining / p.peak, 0, 1) : 0;
      const pctR = Math.round(pct * 1000) / 1000;
      if (force || el._last.pct !== pctR) { el.style.setProperty("--pct", pctR); el._last.pct = pctR; }

      // meta tags
      const tags = [];
      if (st === "ready" && active) tags.push(`<span class="tag go">${C.turnMode === "free" ? "Tap a clock to start" : "Tap to start"}</span>`);
      else if (st === "ready" && C.turnMode === "free" && !p.out) tags.push(`<span class="tag">Tap to start</span>`);
      if (p.out) tags.push(`<span class="tag hot">Out${game.outOrder.indexOf(i) >= 0 && game.players.length > 2 ? " · #" + (game.players.length - game.outOrder.indexOf(i)) : ""}</span>`);
      else if (p.remaining < 0 && C.timing !== "countup") tags.push(`<span class="tag hot">Overtime</span>`);
      if (C.timing === "byoyomi" && !p.out) tags.push(`<span class="tag ${p.inByo ? "warn" : ""}">${p.inByo ? "Byo-yomi " : ""}${p.byo}×${C.byoSeconds}s</span>`);
      if (C.timing === "delay" && active && st === "running" && p.turn < C.increment * 1000) tags.push(`<span class="tag pc">Delay ${((C.increment * 1000 - p.turn) / 1000).toFixed(1)}</span>`);
      if (C.moveLimitEnabled && active && st === "running") {
        const left = C.moveLimit * 1000 - p.turn;
        tags.push(`<span class="tag ${left < 5000 ? "hot" : "pc"}">⏱ ${left > 0 ? Math.ceil(left / 1000) + "s" : "limit"}</span>`);
      }
      if (settings.showMoves && st !== "ready") {
        if (active && st === "running" && !C.moveLimitEnabled && p.turn >= 1000) tags.push(`<span class="tag pc">Turn ${fmtPlain(p.turn)}</span>`);
        if (p.moves > 0) tags.push(`<span class="tag">${p.moves} move${p.moves === 1 ? "" : "s"}</span>`);
      }
      const meta = tags.join("");
      if (force || el._last.meta !== meta) { el._meta.innerHTML = meta; el._last.meta = meta; }

      if (el._pass) {
        const allowed = C.passMaxUses === 0 || p.passUses > 0;
        el._pass.disabled = !(active && st === "running" && allowed && !p.out);
        const label = C.passLabel + (C.passMaxUses > 0 ? " · " + p.passUses : "");
        if (el._pass.textContent !== label) el._pass.textContent = label;
      }
    }

    // dock
    const pb = $("#pauseBtn");
    const showPlay = st === "paused" || st === "ready";
    const want = showPlay ? "play" : "pause";
    if (pb.dataset.ic !== want) { pb.innerHTML = icon(want); pb.dataset.ic = want; }
    pb.classList.toggle("primary", showPlay);
    pb.setAttribute("aria-label", showPlay ? (st === "ready" ? "Start" : "Resume") : "Pause");
    $("#undoBtn").disabled = !game.history.length;
    const roundTxt = C.turnMode === "free" || game.players.length === 1 ? (game.totalMoves ? "Turn " + (game.totalMoves + 1) : "Game") : "Round " + game.round;
    const rEl = $("#dockRound"); if (rEl.textContent !== roundTxt) rEl.textContent = roundTxt;
    const eTxt = st === "over" ? "Final" : fmtPlain(game.elapsed);
    const eEl = $("#dockElapsed"); if (eEl.textContent !== eTxt) eEl.textContent = eTxt;
    const mb = $("#muteBtn"), mi = settings.soundEnabled ? "volume" : "mute";
    if (mb.dataset.ic !== mi) { mb.innerHTML = icon(mi); mb.dataset.ic = mi; }
    const fb = $("#fsBtn"), fi = document.fullscreenElement ? "shrink" : "expand";
    if (fb.dataset.ic !== fi) { fb.innerHTML = icon(fi); fb.dataset.ic = fi; }
    $("#pausedOverlay").classList.toggle("hidden", st !== "paused" || modalOpen());
  }

  // dock idles out so it doesn't distract
  let idleTimer = 0;
  function poke() {
    dock.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (game && game.state === "running") dock.classList.add("idle"); }, 3500);
  }

  // ------------------------------------------------------------------
  // pass overlay
  // ------------------------------------------------------------------

  let passState = null;
  function triggerPass(i) {
    if (!game || passState) return;
    const C = game.cfg, p = game.players[i];
    if (game.active !== i || game.state !== "running" || p.out) return;
    if (C.passMaxUses > 0 && p.passUses <= 0) return;
    if (C.passMaxUses > 0) p.passUses--;
    const ov = $("#passOverlay");
    ov.style.setProperty("--pc", p.color);
    $("#passOverlayLabel").textContent = C.passLabel;
    $("#passOverlayWho").textContent = p.name + (C.passPauses ? " · clocks frozen" : "");
    const total = Math.max(1, Math.round(C.passDuration));
    const bar = $("#passRingBar"), num = $("#passOverlayNumber");
    const circ = 2 * Math.PI * 90;
    bar.style.strokeDasharray = circ;
    bar.style.transition = "none"; bar.style.strokeDashoffset = 0;
    let left = total;
    const show = () => {
      num.textContent = left;
      num.classList.remove("pop"); void num.offsetWidth; num.classList.add("pop");
      requestAnimationFrame(() => { bar.style.transition = "stroke-dashoffset 1s linear"; bar.style.strokeDashoffset = circ * (1 - (left - 1) / total); });
    };
    ov.classList.add("open");
    passState = { i, timer: 0 };
    say(C.passLabel);
    show(); sfx("pass"); buzz(30);
    passState.timer = setInterval(() => {
      left--;
      if (left <= 0) { endPass(true); return; }
      show(); sfx(left <= 3 ? "tick" : "pass");
    }, 1000);
    updateUI(); saveGame();
  }
  function endPass(completed) {
    if (!passState) return;
    clearInterval(passState.timer);
    const i = passState.i;
    passState = null;
    $("#passOverlay").classList.remove("open");
    sfx("warn"); buzz([80, 40, 80]);
    lastNow = null; // don't charge the frozen interval
    if (completed && game && game.cfg.passEndsTurn && game.active === i && game.state === "running") endTurn();
    updateUI();
  }
  $("#passOverlay").addEventListener("click", () => endPass(false));

  // ------------------------------------------------------------------
  // player menu
  // ------------------------------------------------------------------

  function playerMenu(i) {
    if (!game) return;
    const p = game.players[i], C = game.cfg;
    const wasRunning = game.state === "running";
    const canAdjust = C.timing !== "countup";
    const card = openModal(
      mHead(`<span style="width:14px;height:14px;border-radius:50%;background:${p.color};display:inline-block;box-shadow:0 0 12px ${p.color}"></span>${esc(p.name)}`) + `
      <div class="m-section"><div class="m-label">Name</div><input class="m-input" id="pmName" maxlength="24"></div>
      <div class="m-section"><div class="m-label">Colour</div><div class="p-palette" id="pmPal" style="padding:0"></div></div>
      <div class="m-section">
        <div class="m-label">${canAdjust ? "Adjust time" : "Time used"}</div>
        <div class="big-time" id="pmTime"></div>
        <div class="adj-grid">
          <button class="neg" data-adj="-60000">−1m</button><button class="neg" data-adj="-10000">−10s</button>
          <button class="pos" data-adj="10000">+10s</button><button class="pos" data-adj="60000">+1m</button>
        </div>
      </div>
      <div class="m-section m-actions">
        ${!p.out && game.state !== "over" && i !== game.active ? `<button class="btn" id="pmActive">${icon("play")} Make it their turn</button>` : ""}
        ${p.out ? `<button class="btn" id="pmRevive">${icon("restart")} Bring back</button>` : game.state !== "over" ? `<button class="btn danger" id="pmOut">${icon("flag")} Knock out</button>` : ""}
        <button class="btn" id="pmReset">${icon("undo")} Reset clock</button>
      </div>`, { onClose: () => { if (wasRunning && game && game.state === "paused") setPaused(false); renderBoard(); } });
    if (wasRunning) { game.state = "paused"; updateUI(); }
    const nm = $("#pmName", card);
    nm.value = p.name;
    nm.addEventListener("input", () => { p.name = nm.value.trim() || NAMES[i]; saveGame(); });
    const pal = $("#pmPal", card);
    PALETTE.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.style.setProperty("--c", c); if (c === p.color) b.className = "on";
      b.onclick = () => { p.color = c; $$("button", pal).forEach((x) => x.classList.toggle("on", x === b)); saveGame(); };
      pal.appendChild(b);
    });
    const showT = () => ($("#pmTime", card).textContent = fmt(p.remaining, { floor: true }).text);
    showT();
    $$("[data-adj]", card).forEach((b) => (b.onclick = () => {
      const d = Number(b.dataset.adj);
      p.remaining += d;
      if (C.timing === "countup") p.remaining = Math.max(0, p.remaining);
      if (p.remaining > 0) p.overtime = false;
      p.peak = Math.max(p.peak, p.remaining);
      if (p.remaining > settings.lowTimeThreshold * 1000) p.lowWarned = false;
      showT(); saveGame(); sfx("pass");
    }));
    const a = $("#pmActive", card);
    if (a) a.onclick = () => {
      pushHistory();
      setActive(i);
      if (game.state === "ready") game.firstPlayer = i;
      closeModal(); bumpPanel(i); announceTurn(); saveGame();
    };
    const o = $("#pmOut", card);
    if (o) o.onclick = () => { closeModal(); pushHistory(); eliminate(i, "manual"); };
    const r = $("#pmRevive", card);
    if (r) r.onclick = () => {
      pushHistory();
      p.out = false; game.outOrder = game.outOrder.filter((j) => j !== i);
      if (p.remaining <= 0 && C.timing !== "countup") p.remaining = 30000;
      if (game.active < 0) setActive(i);
      closeModal(); toast(p.name + " is back in", "restart"); saveGame();
    };
    $("#pmReset", card).onclick = () => {
      p.remaining = p.start; p.peak = p.start; p.overtime = false; p.lowWarned = false;
      if (C.timing === "byoyomi") { p.byo = C.byoPeriods; p.inByo = p.start <= 0; if (p.inByo) p.remaining = C.byoSeconds * 1000; }
      showT(); saveGame();
    };
  }

  // ------------------------------------------------------------------
  // main menu, shortcuts, results
  // ------------------------------------------------------------------

  function mainMenu() {
    if (!game) return;
    const wasRunning = game.state === "running";
    if (wasRunning) { game.state = "paused"; updateUI(); }
    openModal(mHead("Menu", "menu") + `
      <div class="menu-list">
        ${game.state !== "over" ? `<button class="menu-item" data-a="resume">${icon("play")}<span>Resume<small>Back to the game</small></span><kbd>Space</kbd></button>` : ""}
        <button class="menu-item" data-a="restart">${icon("restart")}<span>Restart<small>Same players and rules, fresh clocks</small></span></button>
        <button class="menu-item" data-a="results">${icon("trophy")}<span>${game.state === "over" ? "Results" : "End game & see results"}<small>Who won, time used, longest turns</small></span></button>
        <button class="menu-item" data-a="settings">${icon("sliders")}<span>Settings<small>Change rules or start a new game</small></span><kbd>Esc</kbd></button>
        <button class="menu-item" data-a="keys">${icon("keyboard")}<span>Keyboard shortcuts</span><kbd>?</kbd></button>
      </div>`, { onClose: () => { if (wasRunning && game && game.state === "paused" && !menuLeaving) setPaused(false); menuLeaving = false; } });
    $$("[data-a]", modalCard).forEach((b) => (b.onclick = () => {
      const a = b.dataset.a;
      if (a === "resume") { closeModal(); return; }
      menuLeaving = true;
      closeModal();
      if (a === "restart") restartGame();
      if (a === "results") { if (game.state === "over") showResults(); else finishGame("manual"); }
      if (a === "settings") showSetup();
      if (a === "keys") showShortcuts();
    }));
  }
  let menuLeaving = false;

  function showShortcuts() {
    openModal(mHead("Keyboard shortcuts", "keyboard") + `
      <div class="keys">
        <span>End turn / start</span><span><kbd>Space</kbd> <kbd>Enter</kbd></span>
        <span>Pick a player (free order)</span><span><kbd>1</kbd>…<kbd>9</kbd> <kbd>0</kbd></span>
        <span>Pause / resume</span><kbd>P</kbd>
        <span>Undo last turn</span><span><kbd>U</kbd> <kbd>Z</kbd></span>
        <span>Pass button</span><kbd>X</kbd>
        <span>Mute</span><kbd>M</kbd>
        <span>Fullscreen</span><kbd>F</kbd>
        <span>Menu</span><kbd>Esc</kbd>
        <span>This help</span><kbd>?</kbd>
      </div>
      <p class="explain" style="margin-top:16px">On a phone, tap your clock to end your turn. Tap ⋯ on any clock to rename a player, add or remove time, or knock someone out.</p>`);
  }

  function showResults() {
    if (!game) return;
    const P = game.players, C = game.cfg;
    const idx = P.map((_, i) => i);
    let ranked;
    if (C.timing === "countup") ranked = idx.slice().sort((a, b) => P[a].used - P[b].used);
    else {
      const alive = idx.filter((i) => !P[i].out).sort((a, b) => P[b].remaining - P[a].remaining);
      const outs = game.outOrder.slice().reverse().filter((i) => P[i].out);
      ranked = alive.concat(outs);
    }
    const winner = P.length > 1 ? P[ranked[0]] : null;
    const kicker = C.timing === "countup" ? "Fastest player" : game.endedBy === "timeout" ? "Last one standing" : "Most time left";
    const podOrder = [ranked[1], ranked[0], ranked[2]].filter((i) => i != null);
    const heights = { 0: 110, 1: 80, 2: 60 };
    const pod = P.length > 1 ? `<div class="podium">${podOrder.map((i) => {
      const place = ranked.indexOf(i);
      return `<div class="pod" style="--pc:${P[i].color}"><span class="pod-name">${esc(P[i].name)}</span><div class="pod-block" style="height:${heights[place]}px">${place + 1}</div></div>`;
    }).join("")}</div>` : "";
    const rows = ranked.map((i, place) => {
      const p = P[i];
      const avg = p.moves ? p.used / p.moves : 0;
      return `<tr><td><span class="who" style="--pc:${p.color}"><i></i>${place + 1}. ${esc(p.name)}</span></td>
        <td>${C.timing === "countup" ? "—" : p.out ? "Out" : fmt(p.remaining, { floor: true }).text}</td>
        <td>${fmtPlain(p.used)}</td><td>${p.moves}</td><td>${avg ? (avg / 1000).toFixed(1) + "s" : "—"}</td><td>${p.longest ? fmtPlain(p.longest) : "—"}</td></tr>`;
    }).join("");
    openModal(mHead("Results", "trophy") + `
      ${winner ? `<div class="winner-banner"><div class="wb-kicker">${kicker}</div><div class="wb-name" style="color:${winner.color}">${esc(winner.name)}</div></div>` : ""}
      ${pod}
      <div class="stats-wrap"><table class="stats">
        <thead><tr><th>Player</th><th>Left</th><th>Used</th><th>Moves</th><th>Avg</th><th>Longest</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="explain" style="margin:-6px 0 16px">${game.totalMoves} moves in ${fmtPlain(game.elapsed)} · ${esc(baseLabel(C))}</p>
      <div class="m-actions">
        <button class="btn" id="rUndo">${icon("undo")} Undo</button>
        <button class="btn" id="rSetup">${icon("sliders")} Settings</button>
        <button class="btn primary" id="rAgain">${icon("restart")} Rematch</button>
      </div>`, { wide: true });
    $("#rAgain").onclick = () => { closeModal(); restartGame(); };
    $("#rSetup").onclick = () => { closeModal(); showSetup(); };
    $("#rUndo").onclick = () => { closeModal(); undo(); };
    $("#rUndo").disabled = !game.history.length;
    if (winner && game.state === "over" && !game.celebrated) {
      game.celebrated = true; saveGame();
      sfx("win"); buzz([60, 40, 60, 40, 160]);
      say((winner.name) + " wins");
      confetti([winner.color, "#ffffff", winner.color, "#ffd166"]);
    }
  }

  // ------------------------------------------------------------------
  // fullscreen + wake lock
  // ------------------------------------------------------------------

  function toggleFullscreen() {
    if (!document.fullscreenElement) (document.documentElement.requestFullscreen || function () { return Promise.reject(); }).call(document.documentElement).catch(() => toast("Fullscreen isn't available here"));
    else document.exitFullscreen().catch(() => {});
  }
  document.addEventListener("fullscreenchange", () => { updateUI(); setTimeout(renderBoard, 120); });

  let wakeLock = null;
  async function wake(on) {
    try {
      if (on && settings.keepAwake && "wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => (wakeLock = null));
      } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (_) { wakeLock = null; }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !gameEl.classList.contains("hidden") && game && game.state !== "over") wake(true);
    if (document.visibilityState === "hidden") saveGame();
  });
  window.addEventListener("pagehide", saveGame);

  // ------------------------------------------------------------------
  // dock + keyboard wiring
  // ------------------------------------------------------------------

  $("#pauseBtn").onclick = () => {
    audio();
    if (!game) return;
    if (game.state === "ready") startClock();
    else if (game.state === "over") showResults();
    else setPaused(game.state === "running");
  };
  $("#undoBtn").onclick = undo;
  $("#muteBtn").onclick = () => { settings.soundEnabled = !settings.soundEnabled; saveSettings(); updateUI(); toast(settings.soundEnabled ? "Sound on" : "Muted", settings.soundEnabled ? "volume" : "mute"); };
  $("#fsBtn").onclick = toggleFullscreen;
  $("#menuBtn").onclick = mainMenu;
  $("#resumeGameBtn").onclick = () => setPaused(false);
  $("#pRestart").onclick = restartGame;
  $("#pSettings").onclick = showSetup;
  $("#pEnd").onclick = () => finishGame("manual");
  gameEl.addEventListener("pointermove", poke);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (e.key === "Escape") {
      if (passState) { endPass(false); return; }
      if (modalOpen()) { closeModal(); return; }
      if (!gameEl.classList.contains("hidden")) { mainMenu(); return; }
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "?") { e.preventDefault(); showShortcuts(); return; }
    if (gameEl.classList.contains("hidden") || !game || modalOpen()) return;
    audio(); poke();
    const k = e.key.toLowerCase();
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (passState) return;
      if (game.state === "ready") startClock();
      else if (game.state === "paused") setPaused(false);
      else if (game.state === "running" && game.active >= 0) {
        if (performance.now() - lastSwitchAt < 150) return;
        endTurn();
      } else if (game.state === "running" && game.cfg.turnMode === "free") {
        const a = aliveIdx(); if (a.length) onPanelTap(a[0]);
      }
      return;
    }
    if (k === "p") { if (game.state === "ready") startClock(); else setPaused(game.state === "running"); return; }
    if (k === "u" || k === "z" || e.key === "Backspace") { e.preventDefault(); undo(); return; }
    if (k === "m") { $("#muteBtn").click(); return; }
    if (k === "f") { toggleFullscreen(); return; }
    if (k === "x" && game.active >= 0 && game.cfg.passEnabled) { triggerPass(game.active); return; }
    if (/^[0-9]$/.test(k)) {
      const i = k === "0" ? 9 : Number(k) - 1;
      if (i < game.players.length && (game.cfg.turnMode === "free" || game.state === "ready")) onPanelTap(i);
    }
  });

  let resizeT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (!gameEl.classList.contains("hidden")) renderBoard(); else renderPreview(); }, 120);
  });

  // ------------------------------------------------------------------
  // boot
  // ------------------------------------------------------------------

  loadSettings();
  importFromHash();
  applyLook();
  bindSetup();
  renderPresets();
  renderPlayerList();
  syncSetup();
  updateResumeCard();
  startPreviewLoop();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// ======================================================================
// Server
// ======================================================================

function appJS() {
  // __name is defined in case a bundler (wrangler keepNames) injected __name() calls into clientApp
  return "/* clock.mazzen.dev */\nvar __name = (f, n) => (Object.defineProperty(f, \"name\", { value: n, configurable: true }), f);\nconst ICONS = " + JSON.stringify(ICONS) + ";\n(" + clientApp.toString() + ")();\n";
}

const MANIFEST = JSON.stringify({
  name: "Clock · mazzen.dev",
  short_name: "Clock",
  description: "A multi-player game clock for chess, board games, debates and game shows.",
  start_url: "/",
  display: "fullscreen",
  orientation: "any",
  background_color: "#07090f",
  theme_color: "#07090f",
  icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
  ],
});

const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c9cff"/><stop offset="1" stop-color="#e879f9"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><circle cx="256" cy="282" r="136" fill="none" stroke="#fff" stroke-width="36"/><path d="M256 210v72l48 32" fill="none" stroke="#fff" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/><rect x="206" y="78" width="100" height="40" rx="20" fill="#fff"/></svg>';

// Network-first so updates show up immediately; falls back to cache offline.
const SW_JS = `
const CACHE = "clock-v2";
const CORE = ["/", "/app.js", "/icon.svg", "/manifest.webmanifest"];
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE))); });
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || (sameOrigin && req.mode === "navigate" ? caches.match("/") : Response.error())))
  );
});
`;

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

function respond(body, type, extra) {
  return new Response(body, {
    headers: Object.assign({ "content-type": type, "cache-control": "no-cache" }, SECURITY_HEADERS, extra || {}),
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/":
      case "/index.html":
        return respond(pageHTML(), "text/html; charset=utf-8");
      case "/app.js":
        return respond(appJS(), "application/javascript; charset=utf-8");
      case "/manifest.webmanifest":
        return respond(MANIFEST, "application/manifest+json");
      case "/icon.svg":
      case "/favicon.ico":
        return respond(ICON_SVG, "image/svg+xml", { "cache-control": "public, max-age=86400" });
      case "/sw.js":
        return respond(SW_JS, "application/javascript; charset=utf-8", { "service-worker-allowed": "/" });
      default:
        return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
    }
  },
};
