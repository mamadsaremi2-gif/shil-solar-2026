# SHIL Clean Partition Map

## Runtime principle

UI pages do not contain engineering rules. Any future calculation must pass through:

`src/engine/core/runRules.js`

Rules are registered only in:

`src/engine/rules/index.js`

## Feature partitions

- `src/modules/auth`: login and welcome
- `src/modules/admin`: admin panel
- `src/modules/dashboard`: dashboard
- `src/modules/projects`: project list / running / final / archived
- `src/modules/new-project`: full new-project wizard
- `src/modules/contact`: contact/support
- `src/modules/feedback`: feedback
- `src/modules/scenarios`: ready scenarios
- `src/modules/assistant`: assistant and education
- `src/modules/common`: fallback/shared pages

## Data

Shared future equipment data starts from:

`src/data/registry`

## Current compatibility layer

To avoid breaking the app, module pages currently re-export legacy page files under `src/pages`. Future cleanup can move each page's actual source into its module after each route is tested.

## Rule rollout process

1. Add one rule file under `src/engine/rules`.
2. Register it in `src/engine/rules/index.js`.
3. Enable it in the target group.
4. Test only that group.
5. Keep UI pages untouched.
