# Self-review: Caption-less image posts

---

## 1. What changed and why?

- **Post model:** I made the `text` field optional with a default of empty string. I added a pre-save hook so a post must have either non-empty text or a photo. If it has neither, it throws an error.
- **NewPost component:** I changed the POST button so it stays enabled when the user has a photo but no caption. Before it was disabled unless there was text.
- **Post display:** I only show the caption block when `props.post.text` is present. So photo-only posts don't show an empty caption area.
- **Tests:** I added unit tests in `post.image.test.js` that cover photo-only posts, caption plus photo, text-only, and the case where both text and photo are empty (should fail).

The issue asked to allow users to post images without a caption. That's what this does.

---

## 2. Why is this the right test layer (unit/integration/UI)?

- I used **integration tests** with Jest and Supertest. They hit the real API endpoints with a test user and assert on the response and what gets saved.
- **Layer:** API/data. The tests create posts through `POST /api/posts/new/:userId` and check that the right things are created or rejected. No browser, no UI. The model logic and controller flow are covered.
- Could add E2E later to click through NewPost and confirm the button stays enabled with just a photo, but the current tests lock in the backend behavior.

---

## 3. What could still break / what's not covered?

- **Frontend edge cases:** The tests don't cover the NewPost UI directly. If someone changes the button logic or the Post display, the backend would still work but the UI could get out of sync.
- **dbErrorHandler:** I had to fix it to handle plain `Error` objects so the pre-save error message comes through. That's covered indirectly when the empty-post test runs.
- **Photo validation:** We're not checking if the photo is a valid image type. The tests use a small PNG. Invalid files might still get through.
- **Empty caption vs empty string:** The model uses default `''` for text. Any place that checks `if (post.text)` should behave the same for photo-only posts.

---

## 4. What risks or follow-ups remain?

- No new risks. The change is narrow.
- Could add client-side validation or a clearer empty state for caption-less posts. The backend is in good shape.
