# SHIL Unified PV 100 Completion Update

## Applied in this update

- Connected the real Unified PV Engine to the solar system configuration page.
- Added `src/engine/unifiedPvUiAdapter.js` as the bridge between current UI drafts, SHIL banks and the unified engine.
- Replaced the solar-panel-power configuration result source with Unified PV output.
- Saved Unified PV live/final results in localStorage:
  - `shil:unifiedPvEngineResult:live`
  - `shil:unifiedPvEngineResult`
  - `shil:unifiedPvEngineResult:input`
- Updated the root `runEngineeringDesign.js` so solar calculations run through the Unified PV Engine instead of the old standalone pipeline.
- Preserved legacy design shape for existing UI while feeding it from the unified engine.
- Removed the solar-panel-power input page fields/blocks requested for deletion:
  - inverter power split input
  - manual panel split controls
  - live solar-panel-power output block
  - battery reference row in the generic live load output
  - old PSH/utility explanatory paragraph
- Renamed configuration output title to:
  - `نتایج پیکربندی با استفاده از توان پنل خورشیدی`
- Renamed the parameter block to:
  - `اعمال ضرایب استاندارد`
- Kept `بانک‌های هوشمند مسیر توان پنل` without extra explanatory paragraph.
- Removed protection/cable rows from the visible solar-panel-power configuration results.
- Removed the detailed protection/cable toggle from the solar-panel-power visible configuration result.
- Updated solar-panel-power summary page to show an exclusive summary based on Unified PV result.
- Removed motor/start-control rows from the solar-panel-power summary path.
- Ensured warning strings from final calculation are UI-safe.

## Double-count prevention policy now enforced by engine

- Protection stage selects cable/protection only.
- Efficiency stage applies cable energy loss once.
- Temperature is used in string/MPPT for voltage safety and in efficiency for power derating, separately.
- Inverter efficiency is applied once.
- Battery roundtrip efficiency is applied once.
- Orientation, IAM, soiling, mismatch and shading are applied once.

## Validation performed here

- Direct Node import test passed for:
  - `runUnifiedPvForUi`
  - `unifiedPvToLegacyDesign`
  - root `runEngineeringDesign.js` syntax
- Full `npm run build` could not be completed in this environment because `node_modules/vite` is not available after extracting the clean ZIP. Run `npm install --legacy-peer-deps` then `npm run build` locally.

## Remaining local test checklist

- Solar path: project path -> solar panel power -> configuration -> summary -> run.
- Manual bank changes: inverter, battery, panel.
- Lower inverter power selection should increase required inverter count or block continuation with warning.
- Autonomy days should update battery count.
- Final summary should avoid repeated unrelated cards.
