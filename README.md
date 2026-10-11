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

## Develop / deploy

```sh
npx wrangler dev      # http://localhost:8787
npx wrangler deploy
```

The client code is the `clientApp` function in `src/worker.js`. The worker serves it as `/app.js` using `Function.prototype.toString`, so it's ordinary JavaScript with no build step.
