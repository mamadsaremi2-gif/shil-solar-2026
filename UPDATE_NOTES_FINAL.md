# SHIL Final Update Notes

## Applied changes

- Added `Per-Inverter / Per-MPPT / Per-String` modular calculation engine.
- Added smart manual-power route behavior: if the user enters total power and manually selects an inverter, SHIL computes:
  - required inverter count,
  - total MPPT count,
  - panels per inverter,
  - strings per MPPT,
  - batteries per inverter or shared battery bank,
  - AC/DC/battery protection per inverter and per MPPT,
  - cable sizing per inverter and MPPT.
- Converted the solar panel bank from ranged products to individual panel records. No `powerRangeW`, `vmpRangeV`, `vocRangeV`, or range-based panel entries remain in the updated SHIL panel bank.
- Added manual overrides for:
  - inverter selection,
  - panel selection,
  - MPPT count per inverter,
  - reserve factor,
  - battery mode.

## Important test case

For `توان کل = 20000W` and manual inverter `SHIL HI2 8KW`:

- SHIL calculates multiple 8kW inverters instead of only warning.
- MPPT and string layout is calculated for each inverter separately.
- AC/DC/battery protection is calculated per inverter, not as a single global number.
