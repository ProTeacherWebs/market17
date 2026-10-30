import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { serializeProduct } from "@/lib/serialize";
import { requireAdmin } from "@/lib/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);
  const { id } = await context.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Товар не найден", 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const name = String(body.name ?? existing.name).trim();
  const brand = String(body.brand ?? existing.brand).trim();
  const description = String(body.description ?? existing.description).trim();
  const imageUrl = String(body.imageUrl ?? existing.images[0] ?? "").trim();
  const categoryId = String(body.categoryId ?? existing.categoryId).trim();
  const price = Number(body.price ?? existing.price);
  const stock = Number(body.stock ?? existing.stock);
  const compareRaw =
    body.compareAtPrice === undefined || body.compareAtPrice === null || body.compareAtPrice === ""
      ? ""
      : String(body.compareAtPrice).trim();
  const compareAtPrice = compareRaw ? Number(compareRaw) : null;
  const published =
    body.published === undefined ? existing.published : Boolean(body.published);

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Укажите название";
  if (!brand) errors.brand = "Укажите бренд";
  if (!description) errors.description = "Укажите описание";
  if (!imageUrl) errors.imageUrl = "Укажите URL фото";
  if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) {
    errors.categoryId = "Выберите категорию";
  }
  if (!Number.isFinite(price) || price < 1 || !Number.isInteger(price)) {
    errors.price = "Цена — целое число от 1";
  }
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
    errors.stock = "Остаток — целое число от 0";
  }
  if (
    compareRaw &&
    (!Number.isFinite(compareAtPrice!) ||
      !Number.isInteger(compareAtPrice!) ||
      compareAtPrice! <= price)
  ) {
    errors.compareAtPrice = "Старая цена больше новой";
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Проверьте поля", errors }, { status: 400 });
  }

  const taken = new Set(
    (await prisma.product.findMany({ select: { slug: true } }))
      .map((p) => p.slug)
      .filter((slug) => slug !== existing.slug),
  );
  const slug = uniqueSlug(String(body.slug || existing.slug || name), taken, existing.slug);

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      brand,
      description,
      price,
      compareAtPrice,
      stock,
      categoryId,
      published,
      images: [imageUrl],
    },
  });
  return NextResponse.json({ product: serializeProduct(product) });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);
  const { id } = await context.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Товар не найден", 404);

  const inOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (inOrders > 0) {
    const product = await prisma.product.update({
      where: { id },
      data: { published: false },
    });
    return NextResponse.json({ product: serializeProduct(product), hidden: true });
  }

  await prisma.productSpec.deleteMany({ where: { productId: id } });
  await prisma.cartItem.deleteMany({ where: { productId: id } });
  await prisma.favorite.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
