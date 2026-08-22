# SHIL Engineering Consolidation Map

## Canonical entry point

All new engineering calculations must enter from:

```js
import { runEngineeringPipeline } from "@/engineering";
```

Relative equivalent inside `src`:

```js
import { runEngineeringPipeline } from "./engineering/index.js";
```

## Canonical modules created/activated

- `src/engineering/index.js`
- `src/engineering/core/runEngineeringPipeline.js`
- `src/engineering/solar/solarDesignEngine.js`
- `src/engineering/solar/solarBankRules.js`
- `src/engineering/emergency/emergencyBankRules.js`
- `src/engineering/battery/batteryEngine.js`
- `src/engineering/handoff/projectFlowData.js`

## Backward-compatible adapters kept

These files remain only to prevent old screens/imports from breaking:

- `src/runEngineeringDesign.js`
- `src/engineering/engine/runEngineeringEngine.js`
- `src/engines/pipeline/engineeringPipeline.js`
- `src/engines/solarDesignEngine.js`
- `src/engines/solarBankRules.js`
- `src/engines/emergencyBankRules.js`
- `src/engines/projectFlowData.js`
- `src/engines/battery/batteryEngine.js`
- `src/calculation/sizing/systemSizingEngine.js`
- `src/calculation/diagnostics/diagnosticEngine.js`
- `src/calculation/diagnostics/diagnosticRules.js`

## Rule

Do not add new calculations in pages, components, `src/calculation`, `src/calculationGateway`, `src/core/calculation`, or `src/engines`.
Add new engineering logic under `src/engineering` and expose it through `runEngineeringPipeline`.
