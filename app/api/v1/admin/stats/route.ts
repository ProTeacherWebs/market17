import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [ordersToday, pendingPayment, outOfStock, users] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start } } }),
    prisma.order.count({ where: { status: "pending_payment" } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.user.count(),
  ]);

  return NextResponse.json({ ordersToday, pendingPayment, outOfStock, users });
}
