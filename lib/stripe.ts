import Stripe from "stripe";

export function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

export function stripeConfigured() {
  return Boolean(stripeSecretKey());
}

export function paymentProvider() {
  const value = (process.env.PAYMENT_PROVIDER || "mock").trim().toLowerCase();
  return value === "stripe" ? "stripe" : "mock";
}

function readPositiveRate(...keys: string[]) {
  for (const key of keys) {
    const raw = (process.env[key] || "").trim();
    if (!raw) continue;
    const rate = Number(raw);
    if (Number.isFinite(rate) && rate > 0) return rate;
  }
  return null;
}

/** Сколько сумов за 1 ₽. */
export function exchangeRateUzs() {
  return readPositiveRate("EXCHANGE_RATE_UZS", "NEXT_PUBLIC_EXCHANGE_RATE_UZS");
}

/** Сколько сумов за 1 USD. */
export function uzsPerUsd() {
  return readPositiveRate("UZS_PER_USD", "NEXT_PUBLIC_UZS_PER_USD");
}

export function stripePaymentsReady() {
  return (
    paymentProvider() === "stripe" &&
    stripeConfigured() &&
    exchangeRateUzs() !== null &&
    uzsPerUsd() !== null
  );
}

let client: Stripe | null = null;

export function getStripe() {
  if (!stripeConfigured()) return null;
  if (!client) {
    client = new Stripe(stripeSecretKey());
  }
  return client;
}

export function appOrigin(request: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return "http://localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export function rubToKopecks(rub: number) {
  return Math.round(rub * 100);
}

export function rubToUzs(rub: number, rateUzsPerRub: number) {
  return Math.round(rub * rateUzsPerRub);
}

/** Сумы → центы USD (Stripe `unit_amount`). */
export function uzsToUsdCents(uzs: number, uzsForOneDollar: number) {
  return Math.max(1, Math.round((uzs / uzsForOneDollar) * 100));
}

/** Центы USD → сумы. */
export function usdCentsToUzs(cents: number, uzsForOneDollar: number) {
  return Math.round((cents / 100) * uzsForOneDollar);
}

export function formatUzs(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} сум`;
}

export function formatUsdFromCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
