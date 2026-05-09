# PR-30 self-review — GitHub issue #30

**Issue:** Ad-hoc request logging in `server/express.js` used `console.log` directly instead of a single shared logging entry point.

**What we did:** Introduced an **Adapter** at `server/helpers/logger.js`: `info()` delegates to `console.log`, `error()` to `console.error`. Request timing middleware calls `logger.info` with the same message shape as before (`[ISO timestamp] METHOD path statusCode durationms`). The generic Express error handler logs through `logger.error(err)` instead of `console.log(err)`.

**Files:** New `server/helpers/logger.js`; `server/express.js` imports the module and replaces direct console use in those two spots.

**Non-goals (per issue):** No external logging services; no broad replacement of `console.*` elsewhere (`server.js`, controllers, email helper left unchanged).

**Checks:** Start the server and hit a route; log line should still show method, path, status, and duration. `npm test` — 17/17 passing.
