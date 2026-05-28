# SHIL method-output update

Applied updates:

1. Equipment-list method
- Output block title changed to: اعلام نتایج خروجی لیست تجهیزات
- Equipment selected list, total power, daily energy, current and relevant equipment calculation values are now shown under equipment-list identity.

2. Solar-panel-power method
- Calculation context uses method label, solar core, manual scenario and selected city.
- Input block keeps panel power, panel count, PSH, losses, effective efficiency and AC output route.
- Result block title changed to: اعلان نتیجه خروجی دیتاهای توان پنل خورشیدی
- Kept fields: total panel power, daily production without losses, PSH/loss source, effective efficiency, orientation/tilt condition.
- Removed fields from visible result: daily production with losses, effective-route power, design range.

3. Total-power method
- Input block asks for project target total power and network voltage/phase.
- Removed emergency usage-hours field from visible UI.
- Result block title changed to: اعلام نتایج دیتاهای وارد شده مربوط به توان کل
- Removed selected equipment count, startup current, surge/start peak and motor/soft fields.
- Shows entered total power, daily energy and current according to voltage/phase.

4. Total-current method
- Input block asks for total current and network voltage/phase.
- Removed emergency usage-hours field from visible UI.
- Result block title changed to: اعلام نتایج دیتاهای جریان کل
- Removed selected equipment count, previous total-power field, daily energy, startup current, surge/start peak and motor/soft fields.
- Shows entered current, selected network voltage/phase and calculated power from current and voltage.

5. Runtime stabilization
- App lazy/Suspense calls use React namespace.
- React hooks in migrated source files use React namespace.
- Profile buckets output uses safe fallback to prevent undefined buckets crashes.
