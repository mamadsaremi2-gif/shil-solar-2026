# SHIL Update - Solar Panel Power Method on Calculation Method Page

This update adds the calculation path **توان پنل خورشیدی** directly to the `/new-project/method` page so the user can continue the project flow from this method after selecting the solar path.

## Main changes
- Added method card: `solar_panel_power` / `توان پنل خورشیدی`
- Added method to `public/calculation-method-cards.json`
- Added method label in `loadEngine.js`
- Added direct input UI for panel-based calculation in `CalculationInputs.jsx`
- Stores:
  - `shil:solarPanelPowerInput`
  - `shil:solarPanelPowerPreview`
  - `shil:loadEngineResult`
- Live outputs include:
  - DC peak power
  - PV daily production
  - load coverage
  - series/parallel panel layout
  - battery kWh needed
  - battery count
  - engineering score
- No price, purchase, sales, or marketplace logic.
