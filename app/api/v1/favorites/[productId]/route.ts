import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function PUT(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);
  const { productId } = await context.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.published) return jsonError("Товар не найден", 404);

  await prisma.favorite.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId },
    update: {},
  });
  return NextResponse.json({ ok: true });
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
  await prisma.favorite.deleteMany({ where: { userId: user.id, productId } });
  return NextResponse.json({ ok: true });
}
