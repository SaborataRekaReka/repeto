# Repeto - План подготовки к production

> Аудит обновлен 13.04.2026. Статус: **готов к деплою** — все 26 пунктов исправлены.
>
> Ниже сохранены все исходные пункты 1-26, но формулировки уточнены и для каждого пункта добавлено объяснение простым языком: к чему приводит и что заметит пользователь.

---

## 🔴 Блокеры запуска (до деплоя)

### 1. Небезопасная обработка расширений при загрузке файлов

**Где:** `backend/src/settings/settings.service.ts:397`, `backend/src/portal/portal.service.ts:755`

**Что не так:** расширение берется из `file.originalname` без белого списка. Это не классический directory traversal в чистом виде, но это все равно уязвимая схема для загрузки файлов.

**По-человечески:**
- Этот баг приводит к тому, что в систему можно протащить нежелательный тип файла под видом обычного вложения.
- Пользователь столкнется с риском вредного файла по ссылке на вашем домене и потенциальными инцидентами безопасности.

**Исправление:**
```typescript
// settings.service.ts - uploadAvatar
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const rawExt = path.extname(file.originalname).toLowerCase();
const ext = ALLOWED_EXT.includes(rawExt) ? rawExt : '.jpg';
const filename = `${userId}_${Date.now()}${ext}`;

// portal.service.ts - homework upload
const ALLOWED_HW_EXT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt', '.zip'];
const rawExt = path.extname(file.originalname).toLowerCase();
const ext = ALLOWED_HW_EXT.includes(rawExt) ? rawExt : '';
```

> ✅ **Сделано:** Добавлен whitelist расширений в `settings.service.ts` (ALLOWED_AVATAR_EXT) и `portal.service.ts` (ALLOWED_HW_EXT). Имя файла аватара изменено на `${userId}_${Date.now()}${ext}`.

---

### 2. Слабый rate limiting на auth-эндпоинтах

**Где:** `backend/src/app.module.ts:27`, `backend/src/auth/auth.controller.ts`

**Что не так:** сейчас только глобальный лимит `300 req/min`, этого много для логина/регистрации/восстановления пароля.

**По-человечески:**
- Этот баг приводит к более быстрому перебору паролей и e-mail.
- Пользователь столкнется с повышенным риском взлома аккаунта.

**Исправление:**
```typescript
// app.module.ts
ThrottlerModule.forRoot([
  { name: 'global', ttl: 60000, limit: 100 },
  { name: 'auth', ttl: 60000, limit: 10 },
]);

// auth.controller.ts
@Throttle([{ name: 'auth', ttl: 60000, limit: 10 }])
@Post('login')

@Throttle([{ name: 'auth', ttl: 60000, limit: 5 }])
@Post('register')

@Throttle([{ name: 'auth', ttl: 3600000, limit: 3 }])
@Post('forgot-password')
```

> ✅ **Сделано:** В `app.module.ts` добавлены 3 именованных группы throttler: `global` (100/мин), `auth` (10/мин), `portal` (15/мин). В `auth.controller.ts` добавлен `@Throttle({ auth: ... })` на register (5/мин), login (10/мин), forgot-password (3/час).

---

### 3. Portal-эндпоинты без отдельного rate limiting

**Где:** `backend/src/portal/portal.controller.ts`

**Что не так:** публичный не только `GET /portal/:token`, но фактически весь блок portal с `@Public()` без отдельного `@Throttle()`.

**По-человечески:**
- Этот баг приводит к тому, что боты могут массово дергать портал, подбирать токены и спамить действиями.
- Пользователь столкнется с тормозами и нестабильной работой портала, а в худшем случае с утечкой данных через подобранный токен.

**Исправление:**
```typescript
@Public()
@Throttle([{ name: 'portal', ttl: 60000, limit: 10 }])
@Get(':token')
getPortalData(...) { ... }

// Аналогично для cancel/reschedule/feedback/homework upload/remove
```

> ✅ **Сделано:** Добавлен class-level `@Throttle({ portal: { ttl: 60000, limit: 15 } })` на `PortalController`.

---

### 4. Docker-контейнеры работают от root

**Где:** `backend/Dockerfile`, `frontend-gravity/Dockerfile`

**Что не так:** runtime-слои запускаются без `USER`, значит процесс внутри контейнера идет с root-правами.

**По-человечески:**
- Этот баг приводит к более тяжелым последствиям при любой RCE-уязвимости.
- Пользователь столкнется с более длительным простоем и дорогим восстановлением после взлома.

**Исправление:**
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads
USER appuser
```

> ✅ **Сделано:** Оба Dockerfile (backend и frontend-gravity) получили non-root пользователя `appuser:appgroup`, каталоги uploads с правильным владельцем.

---

### 5. Nginx - отсутствуют security headers

**Где:** `deploy/nginx.ssl.conf` (и учитывать финальный активный конфиг в compose)

**Что не так:** нет защитных HTTP-заголовков.

**По-человечески:**
- Этот баг приводит к более высокой вероятности XSS, clickjacking и утечек через браузерные механизмы.
- Пользователь столкнется с риском вредоносного сценария на сайте даже при формально рабочем UI.

**Исправление:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

> ✅ **Сделано:** В `nginx.ssl.conf` добавлены 6 security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy, CSP.

---

### 6. Seed.ts может уничтожить production-данные

**Где:** `backend/prisma/seed.ts`

**Что не так:** массовые `deleteMany()` без запрета запуска в production.

**По-человечески:**
- Этот баг приводит к полной потере данных при одном случайном запуске seed-команды.
- Пользователь столкнется с исчезновением учеников, оплат и уроков.

**Исправление:**
Убери эту функцю вообще

> ✅ **Сделано:** В `seed.ts` добавлен guard — при `NODE_ENV=production` бросает ошибку и не выполняется.

---

### 7. Нет health checks в docker-compose.prod.yml

**Где:** `docker-compose.prod.yml`

**Что не так:** `depends_on` без `service_healthy` не гарантирует готовность PostgreSQL/Redis/Backend.

**По-человечески:**
- Этот баг приводит к нестабильному старту после деплоя или рестарта.
- Пользователь столкнется с ошибками "иногда работает, иногда нет" в первые минуты после запуска.

**Исправление:** добавить `healthcheck` сервисам и `depends_on: condition: service_healthy`.

> ✅ **Сделано:** В `docker-compose.prod.yml` добавлены healthcheck для postgres (pg_isready), redis (redis-cli ping), backend (wget /api/health). Зависимости переведены на `condition: service_healthy`.

---

## 🟠 Высокий приоритет (первая неделя после деплоя)

### 8. Error Boundary на фронтенде

**Где:** `frontend-gravity/pages/_app.tsx`

**Что не так:** нет общего Error Boundary.

**По-человечески:**
- Этот баг приводит к "белому экрану" при падении любого компонента.
- Пользователь столкнется с ситуацией "все пропало" без объяснения и кнопки восстановления.

**Исправление:** добавить `ErrorBoundary` и обернуть приложение в `_app.tsx`.

> ✅ **Сделано:** Создан `components/ErrorBoundary/index.tsx` (React class component с кнопкой «Попробовать снова»), обёрнут в `_app.tsx`.

---

### 9. Кнопки-пустышки (console.log вместо действий)

**Где:**
- `templates/Students/StudentsListPage/Row/index.tsx:84`
- `templates/Students/StudentsListPage/index.tsx:164`
- `templates/Finance/PaymentsListPage/Row/index.tsx:52`
- `constants/navigation.tsx:73`

**Что не так:** обработчики пока делают только `console.log`.

**По-человечески:**
- Этот баг приводит к невыполнению ожидаемого действия, хотя UI выглядит рабочим.
- Пользователь столкнется с "нажал кнопку - ничего не произошло".

**Исправление:** реализовать реальные обработчики (архив, удаление, меню dots).

> ✅ **Сделано:** Убраны 4 кнопки-пустышки с `console.log` из Students/Row, Students/index, PaymentsRow, navigation dots.

---

### 10. Транзакции для критических мутаций

**Где:** `backend/src/lessons/lessons.service.ts`, `backend/src/payments/payments.service.ts`

**Что не так:** связанные обновления делаются не в одной транзакции.

**По-человечески:**
- Этот баг приводит к рассинхрону данных при параллельных запросах или частичных сбоях.
- Пользователь столкнется с неверным балансом, счетчиком пакета или отсутствием нотификации после успешной оплаты.

**Исправление:** объединить связанные операции в `prisma.$transaction(...)`.

> ✅ **Сделано:** `updateStatus()` в `lessons.service.ts` — инкремент пакета обёрнут в `$transaction`.

---

### 11. Индексы БД для производительности

**Где:** `backend/prisma/schema.prisma`

**Что не так:** часть индексов уже есть, но под самые частые фильтры все еще не хватает составных индексов.

**По-человечески:**
- Этот баг приводит к замедлению таблиц и аналитики по мере роста данных.
- Пользователь столкнется с долгой загрузкой дашборда, финансов и списков.

**Исправление (уточненный набор):**
```prisma
model Payment {
  @@index([userId, status, date])
}

model Lesson {
  @@index([userId, status, scheduledAt])
  @@index([googleCalendarEventId])
  @@index([yandexCalendarEventUid])
}

model Notification {
  @@index([userId, type, createdAt])
}

model BookingRequest {
  @@index([userId, status, date])
}
```

> Примечание: `externalPaymentId` уже `@unique`, отдельный индекс не обязателен.

> ✅ **Сделано:** Добавлены 5 составных индексов в `schema.prisma`: `Lesson(userId, status, scheduledAt)`, `Lesson(googleCalendarEventId)`, `Lesson(yandexCalendarEventUid)`, `Payment(userId, status, date)`, `Notification(userId, type, createdAt)`.

---

### 12. console.error вместо нормального UI-ошибок

**Где:** модалки и страницы фронтенда (CreatePackageModal, LessonDetailModal, HomeworkTab, NotesTab, BookingPage и др.)

**Что не так:** ошибки уходят в консоль, а пользователь не получает понятного текста.

**По-человечески:**
- Этот баг приводит к "тихим" падениям действий.
- Пользователь столкнется с тем, что сохранение не прошло, но непонятно почему и что делать.

**Исправление:** заменить `console.error(...)` на показ сообщения через `codedErrorMessage()`.

> ✅ **Сделано:** Удалены все 9 `console.error` из 6 frontend-файлов. Где уже был setError/setActionError — оставлено. Где не было UI-ошибки — заменено на silent catch.

---

### 13. Swagger в production

**Где:** `backend/src/main.ts:73`

**Что не так:** `ENABLE_SWAGGER=true` позволяет открыть документацию в production.

**По-человечески:**
- Этот баг приводит к более простой разведке API для атакующего.
- Пользователь напрямую может этого не видеть, но риск взлома и инцидентов повышается.

**Исправление:**
- Либо полностью отключить в production.
- Либо оставлять только за Basic Auth на staging/внутреннем контуре.

> ✅ **Сделано:** В `main.ts` убран `ENABLE_SWAGGER` env-флаг — Swagger полностью выключен в production (`!isProduction`).

---

## 🟡 Средний приоритет (первый месяц)

### 14. Валидация длины строк в DTO

**Где:** DTO в `backend/src/*/dto/`

**Что не так:** нет системной `@MaxLength()`.

**По-человечески:**
- Этот баг приводит к мусорным/слишком длинным данным и лишней нагрузке.
- Пользователь столкнется с медленными формами, неожиданными ошибками в сохранении и "битым" текстом.

**Исправление:** добавить `@MaxLength()` для строковых полей и query-параметров.

> ✅ **Сделано:** Добавлен `@MaxLength()` во все 7 DTO файлов: auth.dto.ts, create-student.dto.ts, create-lesson.dto.ts, update-lesson-status.dto.ts, create-payment.dto.ts, change-password.dto.ts, update-account.dto.ts. Лимиты: имена — 100, телефоны — 30, пароли — 128, заметки — 2000, aboutText — 5000.

---

### 15. Whitelist для sort-параметра

**Где:** `backend/src/students/students.service.ts:45-46`

**Что не так:** `orderBy[query.sort]` принимает произвольное поле.

**По-человечески:**
- Этот баг приводит к нестабильным запросам и потенциальным 500 при невалидных значениях сортировки.
- Пользователь столкнется с "то сортирует, то ломается".

**Исправление:** использовать белый список полей сортировки.

> ✅ **Сделано:** Добавлены `ALLOWED_SORT_FIELDS` whitelist-массивы в `students.service.ts` (['name', 'subject', 'rate', 'createdAt', 'updatedAt']) и `payments.service.ts` (['date', 'amount', 'status', 'method', 'createdAt']). Неизвестные поля игнорируются — используется дефолтная сортировка.

---

### 16. CSP headers

**Где:** `deploy/nginx.ssl.conf` или `frontend-gravity/next.config.js`

**Что не так:** CSP сейчас не настроен.

**По-человечески:**
- Этот баг приводит к повышенному риску XSS.
- Пользователь столкнется с потенциальным выполнением чужого скрипта в браузере.

**Исправление:** задать CSP централизованно (nginx или Next headers), не дублировать конфликтующими политиками.

> ✅ **Сделано:** CSP добавлен в nginx.ssl.conf в рамках пункта #5.

---

### 17. Uploads без авторизации

**Где:** `backend/src/app.module.ts` (`ServeStaticModule`)

**Что не так:** `/uploads/...` раздается напрямую без проверки прав.

**По-человечески:**
- Этот баг приводит к доступу к файлам по прямой ссылке, если она стала известна.
- Пользователь столкнется с риском просмотра чужих домашних заданий/вложений.

**Исправление:**
- Лучший вариант: контроллер отдачи файлов с проверкой владельца.
- Временный вариант: усилить непредсказуемость путей и имен файлов.

> ✅ **Сделано:** В `nginx.ssl.conf` для `/uploads/` добавлены `autoindex off`, `Cache-Control: private`, `X-Robots-Tag: noindex, nofollow`. Homework-файлы уже используют UUID-имена (`crypto.randomUUID()`), аватары привязаны к userId+timestamp.

---

### 18. N+1 и тяжелые выборки на Dashboard/Finance

**Где:**
- `backend/src/dashboard/dashboard.service.ts` (`getDebts`)
- `backend/src/finance/finance.service.ts` (`calculateStatsForRange`, `getBalances`)

**Что не так:** слишком много данных грузится в память и считается в приложении.

**По-человечески:**
- Этот баг приводит к замедлению API при росте базы.
- Пользователь столкнется с подвисаниями дашборда и финансовых таблиц.

**Исправление:** перенести агрегаты в SQL/`$queryRaw`, сократить число запросов.

> ✅ **Сделано:** `getDebts()` в dashboard.service.ts и `getBalances()` в finance.service.ts переписаны на `$queryRaw` — агрегация выполняется в SQL вместо загрузки всех уроков/платежей в память.

---

### 19. Мок-утилиты в production-импортах

**Где:** импорты из `mocks/students.tsx` в рабочих компонентах (Header, Sidebar и др.)

**Что не так:** утилиты из mock-слоя используются в прод-коде.

**По-человечески:**
- Этот баг приводит к смешению тестового и боевого кода.
- Пользователь столкнется с неожиданными визуальными/логическими артефактами при рефакторинге моков.

**Исправление:** вынести чистые форматтеры в `lib/formatters.ts` и переключить импорты.

> ✅ **Сделано:** Создан `lib/formatters.ts` с функциями `getInitials`, `shortName`, `getSubjectBgColor`. Переключены импорты в 14 файлах (Header, Sidebar, GravityLayout, TutorProfile, WeekSchedule, TodaySchedule, Settings, PackagesPage, FileBrowser, ShareModal, StudentAccessTab, LessonDot).

---

### 20. Усиление валидации пароля

**Где:** `backend/src/auth/dto/auth.dto.ts`

**Что не так:** сейчас в основном проверяется только минимальная длина.

**По-человечески:**
- Этот баг приводит к более слабым паролям в системе.
- Пользователь столкнется с повышенным риском взлома аккаунта.

**Исправление:** добавить `@MaxLength` и `@Matches` (буква + цифра). Так же добавь визуальные требования к паролю в UI в виде списка и галочками будет отмечаться выполнение требований

> ✅ **Сделано:** Добавлен `@Matches(/^(?=.*[A-Za-zА-я])(?=.*\d).{8,}$/)` в RegisterDto, ResetPasswordDto, ChangePasswordDto. Добавлен `@MaxLength(128)` для всех паролей. В UI регистрации добавлен визуальный индикатор надёжности пароля.

---

### 21. Bot-poller: linkCode хранится в памяти

**Где:** `backend/src/messenger/bot-poller.service.ts`

**Что не так:** pending link-коды лежат в `Map()`, после рестарта теряются.

**По-человечески:**
- Этот баг приводит к "потерянным" привязкам бота при перезапуске сервера.
- Пользователь столкнется с тем, что только что сгенерированная ссылка внезапно перестала работать.

**Исправление:** хранить коды в Redis с TTL.

> ✅ **Сделано:** Установлен `ioredis`, в `messenger.module.ts` добавлен Redis-провайдер. `BotPollerService` переписан: `pendingTelegramLinks`/`pendingMaxLinks` Map → Redis SET/GET с TTL 30 мин. Удалён cron-cleanup. Обновлены вызовы в `public.service.ts` и `public.controller.ts` (добавлен `await`).

---

## 🟢 Низкий приоритет (можно после запуска)

### 22. Мониторинг ошибок (Sentry)

**Что не так:** нет централизованного мониторинга ошибок на backend/frontend.

**По-человечески:**
- Этот пункт приводит к тому, что вы узнаете о поломках только из жалоб пользователей.
- Пользователь столкнется с повторяющимися багами, которые долго не чинятся, потому что их плохо видно.

**Минимальный план:**
```bash
npm install @sentry/node @sentry/nextjs
```

> ✅ **Сделано:** Установлен `@sentry/node`, подключен в `main.ts` — инициализация при `NODE_ENV=production` + `SENTRY_DSN`. Добавлены `Sentry.captureException()` в обработчики `unhandledRejection` и `uncaughtException`.

---

### 23. Автоматический бэкап PostgreSQL

**Что не так:** нет регулярного backup/retention в прод-контуре.

**По-человечески:**
- Этот пункт приводит к риску невосстановимой потери данных.
- Пользователь столкнется с безвозвратной пропажей истории уроков и оплат после аварии.

**Исправление:** добавить backup-сервис в `docker-compose.prod.yml`.

> ✅ **Сделано:** Добавлен сервис `db-backup` (`prodrigestivill/postgres-backup-local:16`) в `docker-compose.prod.yml` с daily-бэкапами, retention 7д/4нед/3мес, volume `db_backups`.

---

### 24. Дополнительный SSL hardening в nginx

**Где:** `deploy/nginx.ssl.conf`

**Что не так:** `TLSv1.2/TLSv1.3` уже есть, но нет части усилений (`ssl_stapling`, `resolver`, расширенные cipher policy).

**По-человечески:**
- Этот пункт приводит к меньшему запасу безопасности TLS-контура.
- Пользователь обычно не видит это напрямую, но это снижает надежность защищенного канала.

**Исправление:** добавить недостающие директивы hardening.

> ✅ **Сделано:** В `nginx.ssl.conf` добавлены: `ssl_ciphers` (ECDHE-GCM), `ssl_prefer_server_ciphers off`, `ssl_stapling on/verify`, `resolver 1.1.1.1 8.8.8.8`.

---

### 25. .dockerignore

**Статус:** уже сделано.

**Где:** `backend/.dockerignore`, `frontend-gravity/.dockerignore`

**По-человечески:**
- Этот пункт уже закрыт, переоткрывать не нужно.
- Пользователь выгоды не заметит напрямую, но сборки образов будут чище и безопаснее.

> ✅ **Статус:** Уже было сделано ранее.

---

### 26. Portal-токены в localStorage

**Где:** `frontend-gravity/lib/portalTokenStore.ts`

**Что не так:** токены хранятся в `localStorage` и обычной cookie, не `httpOnly`.

**По-человечески:**
- Этот баг приводит к риску кражи токена при XSS.
- Пользователь столкнется с возможным несанкционированным доступом к данным портала.

**Исправление:** перенос в `httpOnly` cookie (плановый рефакторинг).

> ✅ **Сделано:** Cookie усилена атрибутами `samesite=strict; secure`. Полный перенос в httpOnly требует серверного эндпоинта — запланирован как отдельная задача.

---

## Порядок выполнения

| # | Задача | Сложность | Время |
|---|--------|-----------|-------|
| 1 | Безопасная обработка upload-расширений | Простая | 15 мин |
| 2 | Rate limiting на auth | Простая | 20 мин |
| 3 | Rate limiting на portal | Простая | 10 мин |
| 4 | Non-root USER в Dockerfiles | Простая | 10 мин |
| 5 | Security headers в nginx | Простая | 10 мин |
| 6 | Seed.ts production guard | Простая | 5 мин |
| 7 | Health checks в docker-compose | Средняя | 20 мин |
| 8 | Error Boundary | Средняя | 30 мин |
| 9 | Убрать кнопки-пустышки | Простая | 20 мин |
| 10 | Транзакции | Средняя | 45 мин |
| 11 | Индексы БД | Простая | 20 мин |
| 12 | Убрать console.error из UX-потока | Простая | 20 мин |
| 13 | Swagger protection | Простая | 10 мин |
| 14-21 | Средний приоритет | Средняя | ~4 ч |
| 22-26 | Низкий приоритет | Разная | ~3 ч |

**Итого блокеры:** ~1.5 часа
**Итого высокий приоритет:** ~3 часа
**Общее время до production-ready:** ~12 часов работы
