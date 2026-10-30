# Neon для VOLTA (без Docker)

Postgres берём в облаке [Neon](https://neon.tech). Локальный Docker не нужен.

## Шаги

1. Зайди на https://console.neon.tech и войди (GitHub / Google / email).
2. **Create project** → имя например `volta`, регион ближе к тебе (Frankfurt / AWS).
3. После создания открой **Dashboard → Connection details**.
4. Выбери **Connection string** → ветка `main` → роль с правами на запись.
5. Скопируй строку вида:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require
   ```
6. Вставь её в `.env.local` и `.env`:
   ```
   DATABASE_URL=postgresql://...sslmode=require
   AUTH_SECRET=случайная-длинная-строка
   ADMIN_EMAIL=admin@volta.shop
   ```
   `AUTH_SECRET` можно сгенерировать: `openssl rand -base64 32`
7. В корне проекта:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```
8. Вход админа: почта из `ADMIN_EMAIL` (по умолчанию `admin@volta.shop`), пароль `Admin1234`.

## Важно

- В Neon включай **pooled** connection только для serverless runtime, если Prisma ругается — возьми **direct** (без `-pooler` в хосте) для `migrate` / `seed`.
- Строку с паролем не коммить. В `.env.example` только пустой `DATABASE_URL=`.
- Курсы оплаты (`EXCHANGE_RATE_UZS` ≈ 150 сум/₽, `UZS_PER_USD` ≈ 12500) задай отдельно от Stripe.
