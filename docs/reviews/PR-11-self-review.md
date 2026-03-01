# Self-review: User input validation (XSS prevention)

---

## 1. What changed and why?

- **Sanitize helper:** I added `server/helpers/sanitize.js` that uses the `xss` package to escape HTML and scripts. So stuff like `<script>alert(1)</script>` gets stored as `&lt;script&gt;...` and shows up as plain text instead of running.
- **Where it runs:** I wired it into post text, comment text, user name, user about, and signup name. All of those get sanitized before we save to the database.
- **Tests:** I added `user.input.validation.test.js` with 6 tests. They send XSS strings through the API and check that the response has the escaped version, not the raw script tags. Covers posts, comments, profile update, and signup.

The issue said users should not be able to run scripts. Anything they type gets escaped so it stays as text.

---

## 2. Why is this the right test layer (unit/integration/UI)?

- I used **integration tests** with Jest and Supertest. They call the real routes with XSS payloads and assert on what comes back.
- **Layer:** API/data. We're checking that bad input is sanitized before it hits the DB. The tests act like a user submitting a post or comment or updating their profile with script tags.
- Could add E2E to confirm the browser never executes scripts, but the API layer tests prove we're not storing executable content. React escapes by default anyway, so the data layer is the main thing to protect.

---

## 3. What could still break / what's not covered?

- **Other inputs:** I only sanitized post text, comments, name, and about. There might be other fields that take user input. I didn't go through every single one.
- **Rich text or markdown:** If we add a rich text editor later, the sanitizer might strip stuff we want to keep. We'd need to tune the whitelist or use a different approach for HTML content.
- **Email:** Signup and profile use email. I didn't sanitize it because it's validated differently and usually not rendered as HTML. Could revisit if needed.
- **xss package updates:** If the package changes behavior in a future version, we should re-run the tests and maybe add more XSS variants.

---

## 4. What risks or follow-ups remain?

- The xss library is well used and maintained. No known issues with our usage.
- Could add more XSS test cases (event handlers, data URIs, etc.) if we want to be extra sure. The basic script tag case is covered.
- Might want to document that user-facing text fields are sanitized so future contributors know not to bypass it.
