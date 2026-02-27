# Self-review: Email verification (2FA) at signup

> **Solo project requirement:** Rename this file to `PR-<number>-self-review.md` once you open the PR and know the PR number (e.g. `PR-42-self-review.md`).

---

## 1. What changed and why?

- **Backend:** Signup no longer creates a user immediately. It creates a `PendingSignup` record, generates a 6-digit code, sends it by email (Ethereal in dev or real SMTP via `.env`), and returns a `verificationToken` to the client.
- **New route:** `POST /api/users/verify-email` accepts `verificationToken` and `code`; on success it creates the `User` from the pending data and deletes the pending record.
- **Frontend:** After signup form submit, the user is redirected to a “Check your email” page to enter the code; on success they are redirected to sign in. Route for verify page is `/signup/verify` (with `exact` on `/signup` so the verify route matches).
- **Config:** Added `.env` loading via `load-dotenv.js` and `SMTP_*` in config so verification emails can be sent to real addresses (e.g. Gmail App Password).

This was required by the issue: verify the user’s email with a 2FA code sent to their email before completing signup.

---

## 2. Why is this the right test layer (unit/integration/UI)?

- **Integration tests** were added (Jest + Supertest) against the signup and verify-email API. They run with a local MongoDB test database (`mernproject_test`); email sending is mocked so tests are deterministic and require no network/SMTP.
- **Layer:** API/integration. We hit `POST /api/users` and `POST /api/users/verify-email` and assert on status, response body, and that User/PendingSignup records are created or not as specified. This protects the full request→controller→model flow without driving a browser.
- **Unit** tests for code/token generation or **E2E** for the full signup→verify→signin flow could be added later; the current suite focuses on the new API contract and persistence behavior.

---

## 3. What could still break / what’s not covered?

- **Email delivery:** Tests mock the email helper, so “email actually sent” is not asserted. If SMTP is misconfigured or Ethereal is down, signup can still fail in production.
- **Expiry:** Pending signup records expire in 10 minutes; no test for expiry (would require time mocking or a short TTL in test).
- **Races:** Duplicate submit on verify page or multiple tabs are not explicitly tested.
- **Route order / env loading / User model validator** are now covered indirectly by the integration tests; breaking them would cause test failures.

---

## 4. What risks or follow-ups remain?

- **Secrets:** `.env` is gitignored; `.env.example` has placeholders only. Real credentials must stay in local `.env`.
- **Follow-ups:** Add unit/integration tests for signup and verify-email; optionally add E2E for the full signup → verify → signin flow; consider rate-limiting or captcha on signup/verify to reduce abuse.
