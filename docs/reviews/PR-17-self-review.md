# PR-17 self-review

**Issue:** GitHub #17 — SHA-1 HMAC password hashing is weak; replace with bcrypt.

**Change:**
- `server/auth/password.js` — `hashPasswordSync`, `verifyPasswordSync`, `isBcryptHash`; bcrypt via `bcryptjs`; `BCRYPT_SALT_MARKER` for schema `salt` field when using bcrypt (real salt is inside the bcrypt hash).
- `server/models/user.model.js` — `encryptPassword` / `authenticate` delegate to password helpers (legacy SHA-1 HMAC still verified for old rows).
- `server/services/user.service.js` — `hashPasswordWithSalt` wraps `hashPasswordSync` (signup / pending signup).
- `server/controllers/auth.controller.js` — after successful sign-in, if stored hash is still legacy, rehash with bcrypt and save (migration).
- `package.json` — `bcryptjs` dependency.
- `pendingSignup.model.js` — removed unused import.

**Outcome:** New passwords use bcrypt; existing users keep working and upgrade on next sign-in. `npm test` — 17/17 passing.
