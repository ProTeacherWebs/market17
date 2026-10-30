import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE_SEC = 24 * 60 * 60;

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type ValidatedInitData = {
  authDate: number;
  user: TelegramWebAppUser;
};

/** HMAC-SHA256 по правилам Telegram WebAppData. Подделка → null. */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
): ValidatedInitData | null {
  const raw = initData.trim();
  if (!raw || !botToken.trim()) return null;

  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  params.delete("signature");

  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const a = Buffer.from(calculated, "utf8");
  const b = Buffer.from(hash, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get("auth_date") || 0);
  if (!Number.isFinite(authDate) || authDate <= 0) return null;
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age < 0 || age > MAX_AGE_SEC) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    return null;
  }
  if (!user?.id || typeof user.id !== "number") return null;

  return { authDate, user };
}

export function telegramEmail(telegramId: number | bigint) {
  return `tg_${telegramId}@telegram.local`;
}

export function telegramDisplayName(user: TelegramWebAppUser) {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ").trim();
  if (user.username) return user.username;
  return `Telegram ${user.id}`;
}
