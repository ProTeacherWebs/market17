import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";
import { requireUser } from "@/lib/session";

async function ensureCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  const cart = await ensureCart(user.id);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: true },
  });

  const lines = items.map((item) => ({
    productId: item.productId,
    qty: item.qty,
    product: serializeProduct(item.product),
    lineTotal: item.product.price * item.qty,
  }));
  const itemsTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return NextResponse.json({ items: lines, itemsTotal });
}

export async function PUT(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  let body: { items?: { productId?: string; qty?: number }[] };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const incoming = Array.isArray(body.items) ? body.items : [];
  const cart = await ensureCart(user.id);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.cartItem.findMany({ where: { cartId: cart.id } });
    const qtyByProduct = new Map<string, number>();
    for (const item of existing) qtyByProduct.set(item.productId, item.qty);
    for (const item of incoming) {
      const productId = String(item.productId || "");
      const qty = Number(item.qty);
      if (!productId || !Number.isFinite(qty) || qty < 1) continue;
      qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + Math.floor(qty));
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    for (const [productId, rawQty] of qtyByProduct) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.published) continue;
      const qty = Math.min(rawQty, product.stock);
      if (qty < 1) continue;
      await tx.cartItem.create({
        data: { cartId: cart.id, productId, qty },
      });
    }
  });

  return GET(request);
}
