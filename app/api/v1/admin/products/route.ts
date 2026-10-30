import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { serializeProduct } from "@/lib/serialize";
import { requireAdmin } from "@/lib/session";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);
  const items = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items: items.map(serializeProduct) });
}

export async function POST(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const name = String(body.name || "").trim();
  const brand = String(body.brand || "").trim();
  const description = String(body.description || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const categoryId = String(body.categoryId || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);
  const compareRaw = String(body.compareAtPrice ?? "").trim();
  const compareAtPrice = compareRaw ? Number(compareRaw) : null;
  const published = body.published !== false;
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

  const taken = new Set((await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug));
  const slug = uniqueSlug(String(body.slug || name), taken);
  const product = await prisma.product.create({
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
  return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
}
