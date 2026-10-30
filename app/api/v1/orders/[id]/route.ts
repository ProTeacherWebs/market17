import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { serializeOrder, serializeOrderItem } from "@/lib/serialize";
import { requireUser } from "@/lib/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);
  const { id } = await context.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return jsonError("Заказ не найден", 404);
  if (order.userId !== user.id && user.role !== "admin") {
    return jsonError("Заказ не найден", 404);
  }

  return NextResponse.json({
    order: serializeOrder(order),
    items: order.items.map(serializeOrderItem),
  });
}
