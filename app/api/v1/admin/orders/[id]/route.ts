import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/serialize";
import { requireAdmin } from "@/lib/session";

const statuses: OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "shipping",
  "done",
  "cancelled",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);
  const { id } = await context.params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }
  const status = body.status as OrderStatus;
  if (!statuses.includes(status)) return jsonError("Неизвестный статус", 400);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return jsonError("Заказ не найден", 404);
  if (order.status === status) {
    return NextResponse.json({ order: serializeOrder(order) });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
    }
    return tx.order.update({ where: { id }, data: { status } });
  });

  return NextResponse.json({ order: serializeOrder(updated) });
}
