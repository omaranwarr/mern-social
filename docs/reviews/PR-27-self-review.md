# PR-27 self-review — GitHub issue #27

**What was wrong:** The same `Authorization: Bearer …` header was copied in many `fetch` calls in `client/user/api-user.js` and `client/post/api-post.js`.

**What we did:** Added `client/auth/authStrategy.js` with a **Strategy** setup: default `BearerTokenStrategy` builds the header from `credentials.t`, `NoAuthStrategy` adds nothing. `getAuthHeadersFromCredentials` uses whichever strategy is active (`setAuthHeaderStrategy` if you switch later). `getAuthHeaders(token)` wraps the bearer logic for callers that only have a raw token.

**Files:** New `authStrategy.js`; imports and `…getAuthHeadersFromCredentials(credentials)` spreads in both API modules—no manual `Bearer` strings there anymore.

**Behavior:** Same headers as before for signed-in users. No backend changes.

**Checks:** Manual: sign in, load feed, post, like/unlike, follow/unfollow, profile flows. `npm test` if your workflow uses server tests only.
