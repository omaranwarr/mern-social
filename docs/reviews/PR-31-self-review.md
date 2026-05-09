# PR-31 self-review — GitHub issue #31

**Issue:** Several UI screens called `auth.isAuthenticated()` from `auth-helper` directly, spreading auth coupling and making session changes hard to observe from React.

**What we did:** Added **Observer-style** updates: `client/auth/AuthContext.js` exports `AuthProvider` and `useAuth()`. The provider keeps the current session (same shape as `auth.isAuthenticated()`—`false` or `{ user, token }`) in React state and listens for a small browser event emitted when `authenticate` / `clearJWT` run in `auth-helper.js`, so subscribers re-render after sign-in or sign-out without redesigning routing or `Menu`.

**Files:** New `AuthContext.js`; `App.js` wraps `MainRouter` with `AuthProvider`; `auth-helper.js` dispatches `AUTH_STATE_CHANGE_EVENT` after session writes; `Newsfeed.js`, `Post.js`, and `Profile.js` use `useAuth()` only (no direct `auth.isAuthenticated()` in those three).

**Non-goals (per issue):** `Menu`, `PrivateRoute`, `Home`, and other components still use `auth-helper` as before; no new authorization features.

**Checks:** Manual: signed-out redirects and restrictions unchanged; signed-in user can use newsfeed, like/delete posts, profile follow/edit affordances as before. `npm test` — 17/17 passing.
