# SHIL Solar Panel Power Effective Scale Final Update

This package finalizes the solar-panel-power sub-route only.

Applied fixes:
- Utility gateway threshold now uses effective PV power after environmental losses, not raw panel DC power and not startup factor.
- Example: 36 x 700W = 25.2kW raw; with 20% loss = 20.16kW effective, so it remains a normal consumer route.
- Startup factor remains only for inverter/cable/protection sizing.
- Manual panel count is preserved exactly in the engineering engine and is not inflated by string normalization or bank expansion factors.
- Bank expansion factor fields were removed from system banks for this route; banks show selected equipment and allow changing equipment only.
- Battery stays unselected when autonomy days are 0.
- Result table now shows raw panel power, effective power after losses, raw daily production, usable daily production, inverter, panel count, battery status, protection and cable.
- Panel bank reflects the exact selected panel and entered quantity/distribution from the previous step.

No pricing, sales, purchasing, marketplace, or commercial logic is added.
