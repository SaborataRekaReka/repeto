# Bento Modal Principles

Use this checklist when implementing or refactoring Bento feature modals.

## 1) Section Architecture
- Treat each major block as a standalone section:
  - intro
  - live interface cards
  - three-value/benefits section
  - footer CTA
- Keep equal vertical spacing between sections via one parent layout gap.
- Avoid one-off per-section top margins when possible.

## 2) Header Behavior
- For showcase-first modals (for example schedule, payments), hide heavy modal caption in the top chrome.
- Keep close control, but remove visual header emphasis and divider line.

## 3) CTA Consistency
- Keep the same CTA pair in intro and footer for conversion-focused modals.
- Recommended pair:
  - primary: "Start using"
  - secondary: "View pricing"
- Footer stays as the final conversion block.

## 4) Live Interface Cards
- Use 2-3 simplified live cards that are based on existing product screens/components.
- Do not invent new UI widgets, charts, entities, or workflows that do not exist in Repeto.
- If a production component is too heavy, reuse its visual pattern and real data shape in a lighter modal version.
- Each card should be self-explanatory and represent one job-to-be-done.
- Use deterministic, stable animations/state changes (no fragile cursor choreography).

## 5) Card Surface Rules
- No gradient card background for this pattern.
- Use flat background: #F8FAFD.
- Remove decorative outer borders unless functionally needed.
- Keep content contrast by using smaller white internal elements only where necessary.

## 6) Caption Placement
- Place explanatory text below each visual card, not inside the surface.
- Surface should visually end at the card boundary; caption belongs to content flow below.

## 7) Benefits Block
- Before footer CTA, include a dedicated benefits section with exactly three short points.
- Keep icon + title + text structure compact and scan-friendly.

## 8) Copy Style
- Prefer short action-oriented titles.
- Body text should explain flow and outcome, not implementation details.
- Keep wording specific to the modal domain (schedule, payments, students, etc.).

## 9) Responsive Behavior
- Preserve section rhythm on tablet/mobile by reducing, not removing, the shared section gap.
- Keep visual card stacks readable when collapsing to one column.

## 10) Acceptance Check
- Intro, visual cards, benefits, footer are clearly separate sections.
- Section spacing is uniform.
- Visual cards use flat #F8FAFD background and no gradient shell.
- Captions are below cards.
- Lint/errors are clean after refactor.
