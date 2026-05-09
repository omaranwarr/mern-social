# PR-33 self-review — GitHub issue #33

**Issue:** `Newsfeed` and `Profile` both implemented their own post-array add/remove logic (`unshift`, `indexOf`/`splice`), duplicating list coordination and risking inconsistent behavior.

**What we did:** Added a **Mediator** as `client/post/PostListContext.js`: `PostListProvider` holds list state and exposes `setPosts`, `addPost`, and `removePost(postId)`. List updates are implemented once (immutable prepend for add, filter-by-id for remove). Each screen wraps its tree in its own `PostListProvider` instance so feeds stay independent; consumers use `usePostList()` and pass `(post) => removePost(post._id)` into `PostList` where a post object is still expected.

**Files:** New `PostListContext.js`; `Newsfeed.js` splits default export (provider wrapper + inner list UI); `Profile.js` same pattern with `ProfileWithList`.

**Non-goals (per issue):** No backend or UI redesign; behavior matches prior flows (new post at top of feed, delete removes item from feed/profile list).

**Checks:** Manual: create post on feed, delete from feed/profile, profile tab list updates. `npm test` — 17/17 passing.
