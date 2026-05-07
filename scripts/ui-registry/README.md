# UI registry scripts

- `collect-static.ts` — статический сбор интерактивных UI-элементов из `frontend-gravity`.
- `collect-runtime.ts` — runtime-сбор DOM-контролов через Playwright.
- `merge-registry.ts` — объединение static/runtime, приоритизация и генерация итоговых артефактов в `docs/ui-registry`.

## Запуск

```bash
npm run ui-registry:static
npm run ui-registry:runtime
npm run ui-registry:merge
# или
npm run ui-registry
```

## Требования для runtime

- Backend: `http://127.0.0.1:3200`
- Frontend: `http://localhost:3300`
- Тестовый tutor-аккаунт (используются переменные `E2E_TUTOR_EMAIL`, `E2E_TUTOR_PASSWORD` при наличии)

## Артефакты приоритизации

- `docs/ui-registry/priority-backlog.json` — top-20 кластеров по приоритету для следующей итерации.
- `docs/ui-registry/priority-backlog.md` — человекочитаемый ranked backlog.
- `docs/ui-registry/baseline-metrics.json` — baseline метрик (unknown/a11y/testid/analytics/high/medium).
