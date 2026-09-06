SHIL V25.21 - Admin Projects / Engineering Review Visual Parity

Purpose
- Make Admin > Projects follow the compact visual system already used in Engineering Review.
- Keep current project logic and data actions unchanged.

Changes
- Removes purple from project cards and expanded children.
- Closed project rows are compact, one-line accordions.
- Project cards remain closed by default (existing React state is preserved).
- Expanded child is compact and transparent/matte.
- Project summary facts use compact grids.
- Nested report sections remain closed by default.
- Delete / Ready Scenario / Share buttons are equal size, centered, 4px gaps.
- Share controls are compact.
- Global [class*=card] and 220px button rules are overridden only inside Admin Projects.
- Larger screens can show closed project cards in two columns; opened card spans full width.
- Adds CSS as the absolute final import without replacing AdminDashboard.jsx or V25.20 user-center changes.

Install
Run INSTALL.ps1 from the patch folder, or pass -ProjectRoot explicitly.
