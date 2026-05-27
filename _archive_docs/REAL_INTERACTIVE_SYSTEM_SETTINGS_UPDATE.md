# SHIL System Settings Real Interaction Update

This update fixes the System Settings page so it is not only visual:

- `src/components/ProjectStepGuard.jsx`
  - System settings route is now interactive and no longer locked by `shil-readonly-mode` when opened directly.
- `src/pages/project/SystemSettings.jsx`
  - Design mode cards now update the live calculation state.
  - Smart/manual parameter changes are saved live to localStorage.
  - Equipment bank selections activate manual equipment mode.
  - Future expansion factors for inverter, battery, and panel are passed to the engine.
  - Default solar panel is 620W; user can manually select 700W.
  - Confirm stores the final design and navigates to `/new-project/summary/solar`.
- `src/core/calculation/solarAutoDesignEngine.js`
  - Default smart panel is now 620W instead of 700W.
  - System type affects smart inverter voltage selection.
  - Expansion factors remain included in final calculation.
