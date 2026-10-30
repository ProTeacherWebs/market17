import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { deliveryFeeFor } from "@/lib/format";
import { prisma } from "@/lib/db";
import { serializeOrder, serializeOrderItem } from "@/lib/serialize";
import { requireUser } from "@/lib/session";
import type { DeliveryMethod } from "@prisma/client";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: orders.map(serializeOrder) });
}

export async function POST(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  let body: {
    phone?: string;
    recipientName?: string;
    deliveryMethod?: string;
    addressLine?: string | null;
    comment?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const phone = String(body.phone || "").trim();
  const recipientName = String(body.recipientName || "").trim();
  const deliveryMethod = body.deliveryMethod === "pickup" ? "pickup" : "courier";
  const addressLine =
    deliveryMethod === "courier" ? String(body.addressLine || "").trim() : null;
  const comment = String(body.comment || "").trim() || null;
  const errors: Record<string, string> = {};
  if (!phone) errors.phone = "Укажите телефон";
  if (!recipientName) errors.recipientName = "Укажите имя получателя";
  if (deliveryMethod === "courier" && !addressLine) errors.addressLine = "Укажите адрес";
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Проверьте поля", errors }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (!cart) throw new Error("Корзина пуста");
      const lines = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true },
      });
      if (!lines.length) throw new Error("Корзина пуста");

      for (const line of lines) {
        if (!line.product.published) throw new Error(`Товар «${line.product.name}» недоступен`);
        if (line.product.stock < line.qty) {
          throw new Error(`Не хватает «${line.product.name}»`);
        }
      }

      const itemsTotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
      const deliveryFee = deliveryFeeFor(itemsTotal, deliveryMethod as DeliveryMethod);
      const latest = await tx.order.findMany({
        select: { number: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      let max = 1000;
      for (const row of latest) {
        const match = /^V-(\d+)$/.exec(row.number);
        if (match) max = Math.max(max, Number(match[1]));
      }
      const number = `V-${max + 1}`;

      const order = await tx.order.create({
        data: {
          number,
          userId: user.id,
          status: "pending_payment",
          paymentStatus: "unpaid",
          deliveryMethod: deliveryMethod as DeliveryMethod,
          phone,
          recipientName,
          addressLine,
          comment,
          itemsTotal,
          deliveryFee,
          total: itemsTotal + deliveryFee,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              name: line.product.name,
              price: line.product.price,
              qty: line.qty,
            })),
          },
        },
        include: { items: true },
      });

      for (const line of lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.qty } },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    return NextResponse.json(
      {
        order: serializeOrder(result),
        items: result.items.map(serializeOrderItem),
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать заказ";
    return jsonError(message, 400);
  }
}
