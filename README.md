# clock.mazzen.dev

A multi-player game clock for 1–10 players: a chess clock, board-game timer, debate timer, game-show "pass" clock and speech timer.

The whole site is one Cloudflare Worker (`src/worker.js`) with no backend. Settings, custom presets and the game in progress are all stored in the browser.

## Features

- **13 presets**: Bullet, Blitz, Rapid, Classical, Tournament (delay), Go (byo-yomi), Scrabble, Game night, Speed round, Game show, Debate, Speech, Who's slowest. You can also save your own.
- **Timing modes**: sudden death, Fischer increment, simple delay, Bronstein, hourglass, byo-yomi and stopwatch (count-up).
- **Turn order**: in order, reverse, snake (draft order) or free (tap anyone). Optional random first player and "tap anywhere".
- **Move time limit** (shot clock), which can warn, skip the turn or knock the player out. At 0:00 the player is either out or goes into overtime.
- **Players**: names, colours, handicap times and seat shuffling. The ⋯ menu on each clock lets you rename a player, add or remove time, pass them the turn, knock them out or bring them back.
- **Game-show pass button**: a full-screen ring countdown with limited uses. It can also freeze the clocks and end the turn.
- **Undo** any turn. Results at the end show a podium and per-player stats (time used, moves, average and longest turn).
- **Look**: 7 themes, 5 clock fonts, three layouts (auto grid, table seating with the far side flipped, or stacked) and four progress styles (liquid fill, bar, ring or none).
- **Alerts**: low-time pulse, tenths of a second, 4 sound packs with volume, countdown ticks, a voice announcer and haptics.
- Keeps the screen awake, fullscreen, keyboard shortcuts (press `?`), share-a-setup links, a live preview, and resume after a refresh.
- Installable PWA that works offline.

## Look

The default **Plain** look is flat Material, laid out and coloured after the Chess.com Chess Clock
app (its source is public: github.com/ChessCom/android-chessclock): a Time Controls list with a
New Custom Time button and a green Start, and clocks as two full halves (grey waiting, green
running, red out) with a control bar between them. Settings → Style → **Classic** brings back the
original look, with its themes and fonts.

## Android app

`android/` wraps the clock in an Android app that works with no internet: the
pages and Google Fonts are bundled inside, and a small native bridge provides
the voice announcer, vibration, keep-screen-on and fullscreen. Every push to
`main` that touches `src/` or `android/` builds it in GitHub Actions and
publishes it as a release:

https://github.com/Mazika-1/clock/releases/latest/download/Clock.apk

The app updates itself (`Updater.kt`): while it's open it checks the latest release and downloads
a newer build. On Android 12+, once the app has installed one of its own updates, the next ones
install by themselves when you leave the app. The first update, and every update on Android 11 and
older, shows Android's "Update this app?" screen the next time you open it.

Shared setup links (`https://clock.mazzen.dev/#s=...`) open in the app (Android App Links,
verified by `/.well-known/assetlinks.json`, which the Worker serves before the password check).

## Deploy

The repo is connected to Cloudflare Workers Builds, so every push to `main` deploys to clock.mazzen.dev.

## Develop locally

```sh
npx wrangler dev      # http://localhost:8787
npx wrangler deploy
```

The client code is the `clientApp` function in `src/worker.js`. The worker serves it as `/app.js` using `Function.prototype.toString`, so it's ordinary JavaScript with no build step.
