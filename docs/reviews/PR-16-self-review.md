# PR-16 self-review

**Issue:** GitHub #16 — long method `signupRequest` (validation, duplicate check, hashing, persistence, email).

**Change:** After #15 split, `signupRequest` lives in `server/controllers/auth.controller.js`. Helpers added to `server/services/user.service.js`:
- `validateSignupRequest(body)` — required fields + trimmed name / normalized email.
- `ensureEmailNotTaken(emailLower)`.
- `buildPendingSignup({ name, email, salt, hashed_password })` — codes, token, expiry, `PendingSignup` doc (`sanitizeString` on name).
- `persistPendingSignup(normalizedEmail, pendingDoc)` — `deleteMany` + `save`.
- Existing `hashPasswordWithSalt`; `sendVerificationEmail` unchanged in `helpers/email`.

**Outcome:** `npm test` — 17/17 passing; same HTTP behavior as before.
