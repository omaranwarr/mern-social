# PR-12 self-review

**Issue:** GitHub #12 — `javascript:S4123` at `server/controllers/user.controller.js` line 60 (`await sendVerificationEmail(...)`).

**Cause:** JSDoc on `sendVerificationEmail` said `@returns` a plain object; the function is `async`, so the analyzer treated the awaited value as non-thenable.

**Change:** `server/helpers/email.js` line 36 — `@returns` set to `Promise<{ success: boolean, messageId?: string, previewUrl?: string }>`.

**Outcome:** JSDoc matches runtime; no behavior change; signup tests still pass.
