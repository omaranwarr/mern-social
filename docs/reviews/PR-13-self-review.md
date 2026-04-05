# PR-13 self-review

**Issue:** GitHub #13 — `javascript:S7762` at `client/App.js` line 12 (prefer `childNode.remove()` over `parentNode.removeChild(childNode)`).

**Cause:** Server-side JSS styles were removed with `jssStyles.parentNode.removeChild(jssStyles)`; Sonar flags that pattern in favor of `remove()` on the node itself.

**Change:** `client/App.js` line 12 — replaced with `jssStyles.remove()`.

**Outcome:** Same DOM effect (detach `#jss-server-side` after mount); no intended behavior change.
