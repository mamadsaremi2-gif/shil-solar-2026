# SHIL Appearance Migration Map

## Central visual folder

All visual implementation files that were previously scattered at the root of `src` have been moved under:

```txt
src/appearance/
```

## Moved folders

```txt
src/appearance/animations
src/appearance/assets
src/appearance/carousel
src/appearance/charts
src/appearance/image
src/appearance/layout
src/appearance/mobile-ui
src/appearance/orgchart
src/appearance/styles
src/appearance/theme
src/appearance/ui
src/appearance/uiIntegration
src/appearance/visual
```

## Active style imports

The main stylesheet imports in `src/main.jsx` now point to:

```txt
src/appearance/styles/*
```

The mobile shell global style now points to:

```txt
src/appearance/mobile-ui/styles/globals.css
```

## Rule for future UI changes

New visual/theme/layout/style files must be added only inside `src/appearance`.
Do not create new scattered root folders such as `src/styles`, `src/theme`, `src/mobile-ui`, or `src/visual`.

## Notes

Public URL assets referenced as `/assets/...` inside CSS were not rewritten because they refer to runtime/public asset paths, not source imports.
