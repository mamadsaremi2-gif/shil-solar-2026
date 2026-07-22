# SHIL Appearance Layer

This folder is the single source of truth for visual implementation and appearance changes.

## Main sections

- `styles/`: global CSS, SHIL visual overrides, mobile/final UI rules
- `theme/`: visual tokens and SHIL theme definitions
- `mobile-ui/`: mobile-first shell, icons, layout rules, bindings, hooks
- `assets/`: source-level icons/images/logos/backgrounds
- `animations/`: animation components
- `layout/`: layout helpers
- `ui/`: reusable UI layer files
- `visual/`: visual utility components
- `charts/`, `carousel/`, `orgchart/`, `image/`: visual feature modules

## Rule

All future appearance edits must start from `src/appearance`.
Avoid creating new root-level visual folders under `src`.
