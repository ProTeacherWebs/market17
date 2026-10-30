import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, rubToKopecks, stripePaymentsReady } from "@/lib/stripe";

export async function GET(request: Request) {
  if (!stripePaymentsReady()) {
    return NextResponse.json({ error: "Оплата Stripe не подключена" }, { status: 501 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Оплата Stripe не подключена" }, { status: 501 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Нет session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId?.trim();
    const number = session.metadata?.number?.trim();
    if (!orderId || !number) {
      return NextResponse.json({ error: "В сессии нет заказа" }, { status: 400 });
    }

    if (session.currency && session.currency !== "usd") {
      return NextResponse.json({ error: "Ожидалась валюта USD" }, { status: 400 });
    }

    const amountUsdCents = session.amount_total;
    if (amountUsdCents == null || amountUsdCents <= 0) {
      return NextResponse.json({ error: "В сессии нет суммы" }, { status: 400 });
    }

    const metaCents = Number(session.metadata?.amountUsdCents || 0);
    if (metaCents && metaCents !== amountUsdCents) {
      return NextResponse.json({ error: "Сумма сессии повреждена" }, { status: 400 });
    }

    const amountRub = Number(session.metadata?.amountRub || 0);
    if (!Number.isFinite(amountRub) || amountRub <= 0) {
      return NextResponse.json({ error: "В сессии нет суммы в рублях" }, { status: 400 });
    }

    const paymentStatus = session.payment_status === "paid" ? "paid" : "unpaid";
    if (paymentStatus === "paid") {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order && order.paymentStatus !== "paid") {
        const amountKopecks = rubToKopecks(amountRub);
        if (Math.round(order.total * 100) === amountKopecks) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "paid",
              paymentId: session.id,
              status: order.status === "pending_payment" ? "confirmed" : order.status,
            },
          });
        }
      }
    }

    return NextResponse.json({
      orderId,
      number,
      paymentId: session.id,
      amountKopecks: rubToKopecks(amountRub),
      amountUzs: Number(session.metadata?.amountUzs || 0) || null,
      amountUsdCents,
      exchangeRateUzs: Number(session.metadata?.exchangeRateUzs || 0) || null,
      uzsPerUsd: Number(session.metadata?.uzsPerUsd || 0) || null,
      paymentStatus,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        error: "Не удалось проверить оплату",
        ...(process.env.NODE_ENV === "development" && detail ? { detail } : {}),
      },
      { status: 502 },
    );
  }
}
