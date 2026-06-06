# SHIL Engineering Bank Migration Map

Canonical equipment-bank location:

```txt
src/engineering/bank/
```

This folder is now the single definition point for:

- Solar inverter bank
- Solar panel bank
- Lithium battery bank
- DC protection bank
- AC protection bank
- Cable bank

Legacy files under `src/data/*` are backward-compatible adapters only. They must not contain duplicated bank arrays.

Use this import for new code:

```js
import {
  SHIL_SOLAR_PANELS,
  SHIL_SOLAR_INVERTERS,
  SHIL_LITHIUM_BATTERIES,
  SHIL_DC_PROTECTION_BANK,
  SHIL_AC_PROTECTION_BANK,
  SHIL_SOLAR_PROTECTION_BANK,
  SHIL_CABLE_BANK,
} from "@/engineering/bank";
```
