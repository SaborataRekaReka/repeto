# Refactor Checklist

## Stage 0: Baseline Gate

Run from repository root:

```bash
npm run check:baseline
```

Smoke test (requires frontend/backend up):

```bash
npm run check:smoke
```

## Stage 1: Repository Hygiene

- runtime artifacts must stay untracked (`runbook-logs/`, `playwright-report/`, `test-results/`)
- user uploads must stay untracked (`backend/uploads/`)
- local screenshots and temp captures must stay untracked (`tmp-*.png`, `test-results.json`)

## Stage 2: Quality Gates

- `backend` lint must pass with local config
- `frontend` lint and both builds must pass
- CI workflow `Quality Gate` must run on `push` and `pull_request`

## Stage 3: Dead Code Cleanup

- remove legacy components not used in imports (`LessonPanel`, `GravityLayoutOld`)
- remove unused static token dump styles (`styles/tochka.css`)
- verify no references via repository search before delete

## Stage 4: CSS Decomposition

- split dashboard-specific Tochka overrides from `styles/gravity-overrides.css`
- keep dedicated stylesheet (`styles/dashboard-tochka.css`) imported from `_app.tsx`
- preserve selector scope (`.repeto-tochka-dash`) to avoid global bleed

## Stage 5: Note Parsing Centralization

- centralize lesson-note prefixes and parsers in:
  - `frontend-gravity/lib/lessonNotes.ts`
  - `backend/src/common/utils/lesson-note.ts`
- replace local duplicate parsers/constants in hooks/components/services
- treat prefixed system notes consistently in tutor lesson notes flows
