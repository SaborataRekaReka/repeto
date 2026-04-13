# Repeto Production Deployment

## Target setup

- Domain: `repeto.ru` (optional alias: `www.repeto.ru`)
- Host: Timeweb single VPS
- Runtime: Docker + Docker Compose

## 1. Prepare environment

1. Copy `app/backend/.env.example` to `app/backend/.env`.
2. Set production values for at least:
   - `NODE_ENV=production`
   - `JWT_SECRET`
   - `FRONTEND_URL=https://repeto.ru,https://www.repeto.ru`
   - `DATABASE_URL` (if not using default from compose)
   - `YANDEX_DISK_STATE_SECRET`
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (for password reset emails)
   - `VAPID_*` keys (for web push)

## 2. Configure compose secrets

Edit `app/docker-compose.prod.yml` and replace:
- `POSTGRES_PASSWORD`
- `DATABASE_URL` password section

## 3. Build and run

From `app/` directory:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 3.1. DNS for Timeweb

Point A records to VPS public IP:

- `repeto.ru` -> `<VPS_IP>`
- `www.repeto.ru` -> `<VPS_IP>`

## 3.2. TLS certificate (certbot)

Stack is prepared for webroot challenge.

1. Make sure DNS is already pointing to your VPS.
2. Start stack with HTTP nginx config (`deploy/nginx.conf`) so challenge files are served.
3. Issue certificate:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d repeto.ru -d www.repeto.ru --email <YOUR_EMAIL> --agree-tos --no-eff-email
```

4. Switch nginx mount in `docker-compose.prod.yml`:

- from: `./deploy/nginx.conf:/etc/nginx/nginx.conf:ro`
- to: `./deploy/nginx.ssl.conf:/etc/nginx/nginx.conf:ro`

5. Restart nginx:

```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

6. Verify HTTPS:

- `https://repeto.ru/`
- `https://www.repeto.ru/`
- `https://repeto.ru/api/health`

### Renew certificates

Run periodically (for example daily cron):

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew --webroot -w /var/www/certbot
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 4. Apply migrations manually (optional one-off)

The backend container runs `prisma migrate deploy` on startup.

If needed manually:

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## 5. Health check

- API health: `https://repeto.ru/api/health`
- Frontend: `https://repeto.ru/`

## Notes

- Public uploads are stored in backend volume `backend_uploads`.
- Keep `ENABLE_SWAGGER=false` in production unless temporary access is required.
- Root route `/` is now a landing placeholder with entry buttons to auth/project pages.
- `deploy/nginx.conf` is HTTP bootstrap config for certificate issuance, `deploy/nginx.ssl.conf` is the final HTTPS config.
