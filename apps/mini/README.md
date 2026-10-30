# VOLTA Mini App (Telegram)

Отдельная оболочка магазина внутри Telegram. Токены цвета — из SPEC сайта, не тема Telegram.

## Локально

В корне магазина должен быть запущен API (`npm run dev` на :3000).

```bash
npm run dev:mini
```

Vite на :5173 проксирует `/api` → `http://localhost:3000`. Вне Telegram вход не сработает (нет `initData`).

Для проверки внутри Telegram — HTTPS-туннель на 5173 (ngrok / cloudflared).

## Бот в BotFather

1. [@BotFather](https://t.me/BotFather) → `/newbot` → имя и username.
2. Токен в корневой `.env` и `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC...
   ```
3. `/setmenubutton` → URL HTTPS на Mini App.
4. Открой бота → Menu: приложение само шлёт `initData` на `POST /api/v1/auth/telegram` и получает Bearer.

Подделанный `initData` → 401. Токен сессии — 30 дней (`Authorization: Bearer …`).
