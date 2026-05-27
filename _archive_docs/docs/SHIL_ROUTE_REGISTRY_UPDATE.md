# SHIL Route Registry Update

## Purpose
The app route registry has been synchronized with the actual routes rendered in `src/app/App.jsx`.

## Updated file

```text
src/app/app.routes.js
```

## What changed

- Added all active `/new-project/...` routes.
- Added project management sub-routes.
- Added dashboard module route aliases.
- Added route groups for future navigation and guard logic.
- Added `routeWithParams()` helper for dynamic route generation.
- Preserved legacy aliases such as `auth`, `output`, `readyScenarios`, `aiAssistant`, and `userFeedback` to avoid breaking existing imports.

## Route groups

```text
PROJECT_FLOW_ROUTES
PROJECT_MANAGEMENT_ROUTES
DASHBOARD_MODULE_ROUTES
```

## Safe development rule
All future navigation should import paths from `src/app/app.routes.js` instead of hardcoding strings inside components.
