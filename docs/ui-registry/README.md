# UI registry

Реестр UI-элементов Repeto (machine-readable + human-readable).

## Что внутри

- `ui-elements.json` — объединённый реестр статического и runtime-аудита
- `ui-elements.csv` — CSV-экспорт для QA/аналитики
- `routes.md` — покрытие и группировка по маршрутам
- `accessibility-findings.md` — accessibility-наблюдения
- `analytics-events-proposal.md` — предложение по событиям аналитики
- `priority-backlog.json` — top-20 кластеров для следующей итерации
- `priority-backlog.md` — human-readable ranked backlog
- `baseline-metrics.json` — baseline метрик для сравнения дельт

## Сводка

- Найдено UI-элементов: **1193**
- Route coverage (runtime succeeded): **13**
- Runtime incomplete: **true**
- Unknown route: **0**
- Accessibility issues: **44**
- Требуют stable data-testid: **873**
- Требуют analytics event: **951**
- High priority elements: **70**
- Medium priority elements: **837**

## Iteration A outputs

- Canonical group per element (`canonicalGroup`).
- Standardization cluster id per element (`clusterId`).
- Per-element priority block (`priority.score`, `priority.level`, `priority.reasons`).
- Top-20 ranked clusters in `priority-backlog.*`.

## Перезапуск

```bash
npm run ui-registry:static
npm run ui-registry:runtime
npm run ui-registry:merge
# или
npm run ui-registry
```