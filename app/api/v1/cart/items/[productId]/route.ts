import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

async function ensureCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);
  const { productId } = await context.params;

  let body: { qty?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }
  const qty = Number(body.qty);
  if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
    return jsonError("Некорректное количество", 400);
  }

  const cart = await ensureCart(user.id);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.published) return jsonError("Товар не найден", 404);

  if (qty === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return NextResponse.json({ ok: true });
  }

  const nextQty = Math.min(qty, product.stock);
  if (nextQty < 1) return jsonError("Нет в наличии", 400);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, qty: nextQty },
    update: { qty: nextQty },
  });
  return NextResponse.json({ ok: true, qty: nextQty });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);
  const { productId } = await context.params;
  const cart = await ensureCart(user.id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return NextResponse.json({ ok: true });
}
