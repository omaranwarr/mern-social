# Pull Request: Email verification (2FA) at signup

**Copy the sections below into your GitHub PR description.**

---

## Closes

Closes #<ISSUE_NUMBER>

*(Replace `<ISSUE_NUMBER>` with the actual issue number, e.g. `Closes #42`)*

---

## Summary of what changed

- **Signup flow:** Submitting the signup form no longer creates a user immediately. The server creates a pending signup, sends a 6-digit verification code to the user’s email, and returns a token. The client redirects to a “Check your email” page.
- **Verify page:** New route `/signup/verify` where the user enters the 6-digit code. Submitting calls `POST /api/users/verify-email` with the token and code; on success the user is created and the client redirects to sign in.
- **Email:** Verification emails are sent via nodemailer. Without SMTP config, the app uses Ethereal (test inbox); with `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` in `.env`, real emails (e.g. Gmail) are sent. `.env` is loaded via `load-dotenv.js` from the project root.
- **Other:** Added `PendingSignup` model, `server/helpers/email.js`, `VerifyEmail.js` component, request logging in development, and README/.env.example updates for email setup.

---

## How to run the relevant tests

**Automated tests (Jest + Supertest):**

MongoDB must be running locally. Tests use the database `mernproject_test` (no network download).

```bash
npm install
npm test
```

Tests cover: signup request returns 200 + `verificationToken` and does not create a User; duplicate email returns 400; verify-email with valid/invalid code (400 for bad code, 200 and User created for valid code).

**Manual verification (optional):**

1. Start the app: `npm run development`
2. Open http://localhost:3000/signup, submit name/email/password, then enter the 6-digit code (from Ethereal preview URL in the server log or from real email if SMTP is configured).
3. Confirm redirect to sign in and that the new account can sign in.

---

## Evidence (what behavior is now protected / what would regress)

| Scenario | Expected behavior | What would regress if reverted |
|----------|--------------------|---------------------------------|
| Signup submit | No user created yet; code sent; redirect to verify page | User would be created immediately; no email; no verify step |
| Valid code on verify page | User created; redirect to sign in; can sign in | Verify would fail or user would not be created |
| Invalid/expired code | Error message; stay on verify page | Invalid codes might be accepted or wrong error shown |
| No SMTP config | Ethereal used; code in server console / preview URL | Real SMTP might be required or email would fail silently |

Manual run-through of the above flow is the current “test” until automated tests are added.
