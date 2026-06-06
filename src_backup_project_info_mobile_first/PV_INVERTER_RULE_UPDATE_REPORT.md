# PV/Inverter Rule Update

Applied the corrected solar-panel route rule:

1. Daily energy = raw load power * PSH.
2. Required PV array power = daily energy / (PSH * environmental efficiency).
3. Panel count = ceil(required PV array power / selected panel power).
4. The 10-30 percent increase/decrease selector is applied only after PV array power is calculated, and only as the inverter sizing target.
5. Default inverter sizing correction is 20 percent decrease.

Expected validation example:

- Load: 20 kW
- PSH: 5.7 h
- Efficiency: 0.92
- Daily energy: 114 kWh/day
- Required PV array: 21.75 kW
- 620 W panel count: 36 panels
- Inverter target with 20 percent decrease: about 17.4-18 kW
