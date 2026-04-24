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
Этап 5: frontend data layer

Решить судьбу самописного useApi.ts (line 1): либо формализовать его как mini-query-client с invalidation keys, либо перейти на TanStack Query/SWR. Вынести API DTO/mapper слой из hooks: api/students, api/lessons, api/payments. Добавить generated/openapi types или общий contract package. Убрать raw: any мапперы постепенно.

Готово когда: после create/update/delete данные обновляются через понятные cache keys, а не ручной refreshKey.

Этап 6: backend modularization

Ввести ConfigModule с validation schema и убрать 84 прямых process.env из сервисов. Разбить толстые сервисы: auth payment/email/token service; files cloud providers; notifications scheduler/delivery/templates; portal booking/review/homework/profile. Вынести Google/Yandex/YooKassa/SMTP clients в отдельные providers с retry/error mapping.

Готово когда: сервисы отвечают за один домен, интеграции мокируются в unit/e2e тестах.

Этап 7: модель данных и контракты

Заменить строковые PORTAL_REVIEW: / LESSON_MATERIALS: на нормальные поля: например LessonReview, LessonMaterial, LessonNote.type. JSON-настройки пользователя типизировать и валидировать; секреты интеграций и YooKassa хранить зашифрованно. Для uploads разделить public/private: аватары можно публично, сертификаты и домашки через auth endpoint или signed URLs.

Готово когда: приватный файл нельзя открыть просто по /uploads/....

Этап 8: performance

Переписать dashboard aggregates: сейчас dashboard.service.ts (line 144) делает последовательные месячные запросы; лучше один grouped SQL по месяцам. В students/finance убрать загрузку всех related lessons/payments в память там, где нужен только balance. На фронте включить bundle analyzer, динамически грузить тяжелые панели/графики/lottie, заменить <img> на next/image, оптимизировать public images. В public 201 файл на ~39.9 MB, эвристически 145 файлов на ~12 MB не найдены по ссылкам.

Готово когда: dashboard API не растет линейно от количества месяцев/учеников, а first-load JS снижен хотя бы на 20-30%.

Этап 9: production hardening