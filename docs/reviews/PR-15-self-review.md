# PR-15 self-review

**Issue:** GitHub #15 — “god controller” / low cohesion in `server/controllers/user.controller.js` (mixed auth, profile, follow, people).

**Change:** Split by responsibility; shared helpers in `server/services/user.service.js`:
- `auth.controller.js` — existing signin/signout/JWT middleware plus `signupRequest`, `verifyEmailAndSignup`, `create` (same handlers as before, signup uses `hashPasswordWithSalt` / code+token generators from the service).
- `profile.controller.js` — `userByID` (via `findUserProfileById` in service), `read`, `list`, `update`, `remove`, `photo`, `defaultPhoto`.
- `follow.controller.js` — `addFollowing`, `addFollower`, `removeFollowing`, `removeFollower`.
- `people.controller.js` — `findPeople`.
- Removed `user.controller.js`.

**Routes:** `server/routes/user.routes.js` and `server/routes/post.routes.js` import the new controllers; `router.param('userId', …)` uses `profileCtrl.userByID`.

**Outcome:** `npm test` — 17/17 passing; intended HTTP behavior unchanged.
