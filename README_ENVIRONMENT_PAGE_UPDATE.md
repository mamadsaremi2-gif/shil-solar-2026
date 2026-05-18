# SHIL Environment Page Update

Applied rules:

- Page flow is now: Header -> Step Flow -> Iran Heating Map -> Location -> Climate Data -> Installation Conditions -> Engineering Analysis -> Summary -> Footer.
- Iran heating map is placed immediately after the Step Flow block.
- Compass upload now asks the user whether they want to choose a compass screenshot from the gallery or add it later.
- Site installation photo upload now supports multiple images.
- Environment confirmation now saves the draft and navigates to `/new-project/path` instead of calculation method.
- Added mobile-friendly CSS for map sizing, smart upload buttons, and multi-image previews.

Modified files:

- `src/pages/project/Environment.jsx`
- `src/styles/shil-ui.css`
