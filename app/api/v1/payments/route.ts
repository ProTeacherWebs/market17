import { NextResponse } from "next/server";
import {
  appOrigin,
  exchangeRateUzs,
  getStripe,
  rubToKopecks,
  rubToUzs,
  stripePaymentsReady,
  uzsPerUsd,
  uzsToUsdCents,
} from "@/lib/stripe";

type Body = {
  orderId?: string;
  number?: string;
  total?: number;
  email?: string;
};

export async function POST(request: Request) {
  if (!stripePaymentsReady()) {
    return NextResponse.json(
      {
        error:
          "Оплата Stripe не подключена. Нужны STRIPE_SECRET_KEY, PAYMENT_PROVIDER=stripe, EXCHANGE_RATE_UZS и UZS_PER_USD.",
      },
      { status: 501 },
    );
  }

  const stripe = getStripe();
  const rateUzs = exchangeRateUzs();
  const rateUsd = uzsPerUsd();
  if (!stripe || rateUzs == null || rateUsd == null) {
    return NextResponse.json({ error: "Оплата Stripe не подключена" }, { status: 501 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  const number = body.number?.trim();
  const total = typeof body.total === "number" ? body.total : NaN;
  if (!orderId || !number || !Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: "Нужны orderId, number и total" }, { status: 400 });
  }

  const origin = appOrigin(request);
  const amountUzs = rubToUzs(total, rateUzs);
  const amountUsdCents = uzsToUsdCents(amountUzs, rateUsd);
  if (amountUzs < 1 || amountUsdCents < 1) {
    return NextResponse.json({ error: "Сумма после конвертации слишком мала" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountUsdCents,
            product_data: {
              name: `Заказ ${number}`,
              description: `${total} ₽ → ${amountUzs} сум → $${(amountUsdCents / 100).toFixed(2)}`,
            },
          },
        },
      ],
      metadata: {
        orderId,
        number,
        amountRub: String(total),
        amountKopecks: String(rubToKopecks(total)),
        amountUzs: String(amountUzs),
        amountUsdCents: String(amountUsdCents),
        exchangeRateUzs: String(rateUzs),
        uzsPerUsd: String(rateUsd),
      },
      customer_email: body.email?.trim() || undefined,
      success_url: `${origin}/checkout/success?order=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/account/orders/${encodeURIComponent(orderId)}?pay=cancel`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe не вернул ссылку оплаты" }, { status: 502 });
    }

    return NextResponse.json({
      url: session.url,
      paymentId: session.id,
      amountUzs,
      amountUsdCents,
      exchangeRateUzs: rateUzs,
      uzsPerUsd: rateUsd,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        error: "Не удалось создать оплату Stripe",
        ...(process.env.NODE_ENV === "development" && detail ? { detail } : {}),
      },
      { status: 502 },
    );
  }
}
