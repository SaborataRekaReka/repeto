# UI registry scripts

- `collect-static.ts` — статический сбор интерактивных UI-элементов из `frontend-gravity`.
- `collect-runtime.ts` — runtime-сбор DOM-контролов через Playwright.
- `merge-registry.ts` — объединение static/runtime, генерация итоговых артефактов в `docs/ui-registry`.

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
