# Summary root layer fix

The remaining visual layer shown in DevTools was the page-level `.shil-engineering-content` container, not a data card.

Changes:
- Added `shil-summary-clear-engineering` to the Summary page shell.
- Removed background, background-image, border, shadow, filter and backdrop-filter from the summary page main container, `.shil-engineering-content`, its direct guard wrapper, and `.shil-summary-page`.
- Disabled all `::before` and `::after` decorative layers on those containers.
- Kept data grids, data cells, warnings and action buttons intact.
