# Theme Architecture

This directory now uses a layered approach to reduce deep CSS hunts.

## Load order (in `pages/_app.tsx`)
1. `gravity-overrides.css` (legacy, large)
2. `dashboard-tochka.css` (legacy dashboard-specific)
3. `theme-tokens.css` (single source of truth for theme values)
4. `theme-components.css` (shared component-level overrides)
5. `theme-navigation.css` (sidebar/menu active behavior)

## Where to edit
- Colors, accent, shared hover strengths, active-state tokens:
  - `theme-tokens.css`
- Borders/hover/dividers of shared UI blocks (cards, widgets, schedule blocks):
  - `theme-components.css`
- Active menu visual behavior (rail/context sidebar icon/text/bg):
  - `theme-navigation.css`

## Rule of thumb
- New global theme behavior should go into `theme-*` files.
- Avoid adding new theme rules to `gravity-overrides.css` / `dashboard-tochka.css` unless the rule is strictly legacy-local and cannot be generalized.
