import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { serializeCategory } from "@/lib/serialize";
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
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return jsonError("Категория не найдена", 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const name = String(body.name ?? existing.name).trim();
  const parentId =
    body.parentId === undefined
      ? existing.parentId
      : body.parentId
        ? String(body.parentId)
        : null;
  const sort = Number(body.sort ?? existing.sort);
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Укажите название";
  if (!Number.isFinite(sort) || !Number.isInteger(sort) || sort < 0) {
    errors.sort = "Порядок — целое число от 0";
  }
  if (parentId === id) errors.parentId = "Категория не может быть родителем себе";
  if (parentId && !(await prisma.category.findUnique({ where: { id: parentId } }))) {
    errors.parentId = "Родитель не найден";
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Проверьте поля", errors }, { status: 400 });
  }

  const taken = new Set(
    (await prisma.category.findMany({ select: { slug: true } }))
      .map((c) => c.slug)
      .filter((slug) => slug !== existing.slug),
  );
  const slug = uniqueSlug(String(body.slug || existing.slug || name), taken, existing.slug);
  const category = await prisma.category.update({
    where: { id },
    data: { name, slug, parentId, sort },
  });
  return NextResponse.json({ category: serializeCategory(category) });
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

  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) return jsonError("Сначала уберите товары из категории", 400);
  const children = await prisma.category.count({ where: { parentId: id } });
  if (children > 0) return jsonError("Сначала удалите подкатегории", 400);

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
