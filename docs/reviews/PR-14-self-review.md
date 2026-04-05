# PR-14 self-review

**Issue:** GitHub #14 — `javascript:S6774` at `client/auth/PrivateRoute.js` line 5 (`component` missing in props validation).

**Cause:** `PrivateRoute` destructures `component` from props but had no `propTypes`, so the `component` prop was unchecked.

**Change:** `client/auth/PrivateRoute.js` — import `prop-types`, set `PrivateRoute.propTypes = { component: PropTypes.elementType.isRequired }`, drop unused `Component` import from `react` (the route target comes from props only).

**Outcome:** Runtime behavior unchanged; invalid `component` types surface as prop-type warnings in development. The issue text about “Last name” / DB does not apply to this Sonar rule or file; this PR only addresses props validation for `PrivateRoute`.
