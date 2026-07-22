# Summary Page Cleanup Report

## Scope
The engineering summary page was rebuilt to remove redundant visual layers without changing calculation, workflow, navigation, warning, or result data behavior.

## Changes
- Replaced repeated `shil-section-card` and `shil-section-head` wrappers with semantic, flat `shil-summary-section` blocks.
- Removed all decorative backgrounds, gradients, glass effects, shadows, radii, overlays, and pseudo-elements from the summary page.
- Preserved data tables as the only bordered content containers because they display actual values.
- Kept warnings, details accordion, and all solar/emergency/utility summary data.
- Removed inline positioning and `translateX(33px)` from the confirmation slot.
- Returned the confirmation button to normal document flow.
- Removed fixed/minimum empty heights and white backing layers around the confirmation area.
- Added the dedicated `shil-summary-clear-engineering` page class for stable page-specific targeting.
- Improved accessibility with section labels, table labels, header scopes, and accordion state.

## Functional behavior preserved
- Step approval via `approveProjectStep("summary")`.
- Navigation to `/new-project/run/:domain`.
- Solar, emergency, and utility domain summaries.
- Warning rendering.
- Expandable detail rows.
