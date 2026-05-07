# UI registry

Реестр UI-элементов Repeto (machine-readable + human-readable).

## Что внутри

- `ui-elements.json` — объединённый реестр статического и runtime-аудита
- `ui-elements.csv` — CSV-экспорт для QA/аналитики
- `routes.md` — покрытие и группировка по маршрутам
- `accessibility-findings.md` — accessibility-наблюдения
- `analytics-events-proposal.md` — предложение по событиям аналитики

## Сводка

- Найдено UI-элементов: **1026**
- Route coverage (runtime succeeded): **0**
- Accessibility issues: **32**
- Требуют stable data-testid: **804**
- Требуют analytics event: **836**
- Runtime incomplete: **true**

## Перезапуск

```bash
npm run ui-registry:static
npm run ui-registry:runtime
npm run ui-registry:merge
# или
npm run ui-registry
```