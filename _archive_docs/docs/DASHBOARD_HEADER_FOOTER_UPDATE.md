# Dashboard Header/Footer Unification

## Changed files

- `src/pages/Dashboard.jsx`
- `src/styles/shil-ui.css`

## What changed

Dashboard now uses the shared `ShilPageShell` component, the same fixed header/footer system used by pages such as New Project.

## Preserved behavior

- Dashboard icons remain rendered from `dashboardItems`.
- Existing logout behavior is unchanged.
- Online/offline chip is preserved.
- No dashboard feature or navigation item was removed.

## UI rule

The Dashboard page now follows the same mobile fixed header/footer rules:

- Fixed top header
- Center capsule title
- Fixed bottom footer
- Content scroll/safe area protected from header/footer overlap
- No global horizontal overflow
