Root cause found: the live app crashes during startup with `ReferenceError: Cannot access 'ug' before initialization`. This maps to `src/data/journey.ts`, where the `DEMO` object calls `rbtModules()` / `bcbaModules()` before the module-level coordinator constants are initialized. After minification, that temporal-dead-zone crash prevents the whole app from rendering in all windows.

Plan:
1. Move the RBT/BCBA coordinator constants above the `DEMO` object in `src/data/journey.ts`, before any calls to `rbtModules()` or `bcbaModules()`.
2. Remove the duplicate lower constant declarations so the file has one clear initialization order.
3. Validate the app route loads without the startup ReferenceError using browser console/network checks.

Technical details:
- This is a frontend initialization-order bug, not a browser cache/incognito issue.
- No database changes are needed.
- The fix is intentionally small and limited to the Journey data module that caused the crash.