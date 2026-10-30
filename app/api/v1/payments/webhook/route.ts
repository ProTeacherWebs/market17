import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, stripeSecretKey } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret || !stripeSecretKey()) {
    return NextResponse.json({ error: "Webhook не настроен" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Нет подписи" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "Подпись неверна" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId?.trim();
    if (orderId && session.payment_status === "paid") {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order && order.paymentStatus !== "paid") {
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

  return NextResponse.json({ received: true });
}
