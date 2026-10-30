# API VOLTA `/api/v1`

Базовый URL: `{NEXT_PUBLIC_APP_URL}/api/v1`. Ответы JSON. Ошибка: `{ "error": "текст" }`.

## Авторизация

- Веб: cookie сессии Auth.js после `POST /auth/login` или Google.
- Mini App / Expo: `Authorization: Bearer <token>` после `POST /auth/telegram` (и позже логина Expo). Неверный Bearer → `401` «Неверный токен».
- Без cookie и без Bearer защищённые маршруты отвечают `401` «Нужен вход».

Картинки в ответах — пути вида `/products/….jpg`. Для Expo/Telegram соберите абсолютный URL: `{NEXT_PUBLIC_APP_URL}{path}`.

## Публичное

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/bootstrap` | Категории, товары, specs, баннеры (гидрация витрины) |
| GET | `/categories` | `{ items }` |
| GET | `/products` | Query: `category`, `brand`, `min`, `max`, `stock=1`, `sale=1`, `sort`, `page`, `q` → `{ items, page, pages, total, brands }` |
| GET | `/products/:slug` | `{ product, specs, related }` |
| GET | `/banners` | `{ items }` |

## Auth / профиль

| Метод | Путь | Тело / заметка |
| --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password, repeat }` → 201 `{ user }` |
| POST | `/auth/login` | `{ email, password }` → сессия + `{ user }` |
| POST | `/auth/telegram` | `{ initData }` (строка WebApp) → `{ token, user }`. Без `TELEGRAM_BOT_TOKEN` → 501. Подделка → 401 |
| POST | `/auth/logout` | сессия |
| GET | `/me` | `{ user }` без passwordHash |
| PATCH | `/me` | `{ name }` |
| POST | `/me/password` | `{ current?, password, repeat }` |
| POST | `/me/avatar` | `multipart/form-data` поле `file` (jpg/png/webp ≤ 2 МБ) |

Пример пользователя:

```json
{
  "id": "clx…",
  "email": "buyer@mail.ru",
  "name": "Иван",
  "image": "/avatars/uploads/clx….jpg?v=1",
  "role": "customer",
  "createdAt": "2026-10-30T12:00:00.000Z"
}
```

## Корзина и избранное (сессия)

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/cart` | `{ items: [{ productId, qty, product, lineTotal }], itemsTotal }` |
| PUT | `/cart` | `{ items: [{ productId, qty }] }` — merge с текущей (гостевой слив) |
| PATCH | `/cart/items/:productId` | `{ qty }` (`0` удаляет) |
| DELETE | `/cart/items/:productId` | |
| GET | `/favorites` | `{ ids, items }` |
| PUT | `/favorites/:productId` | |
| DELETE | `/favorites/:productId` | |

## Заказы (сессия)

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/orders` | свои |
| POST | `/orders` | из корзины, транзакция со списанием остатка |
| GET | `/orders/:id` | владелец или admin |

Пример `POST /orders`:

```json
{
  "phone": "+7 999 000-00-00",
  "recipientName": "Иван",
  "deliveryMethod": "courier",
  "addressLine": "Москва, …",
  "comment": null
}
```

Ответ 201: `{ "order": { "id", "number": "V-1001", "status": "pending_payment", "paymentStatus": "unpaid", "total": 20490, … }, "items": […] }`.

## Админ (role=admin)

| Метод | Путь |
| --- | --- |
| GET | `/admin/stats` |
| PATCH | `/admin/orders/:id` `{ status }` |
| GET/POST | `/admin/products` |
| PATCH/DELETE | `/admin/products/:id` |
| GET/POST | `/admin/categories` |
| PATCH/DELETE | `/admin/categories/:id` |
| GET/PATCH | `/admin/banners` |

## Оплата Stripe

| Метод | Путь |
| --- | --- |
| POST | `/payments` | Checkout Session |
| GET | `/payments/confirm?session_id=` | проверка + запись `paid` в Postgres |
| POST | `/payments/webhook` | `checkout.session.completed` |

Сравнение товаров — только клиент (`localStorage`), не API.
