import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { serializeCategory } from "@/lib/serialize";
import { requireAdmin } from "@/lib/session";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);
  const items = await prisma.category.findMany({ orderBy: [{ sort: "asc" }, { name: "asc" }] });
  return NextResponse.json({ items: items.map(serializeCategory) });
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
  const parentId = body.parentId ? String(body.parentId) : null;
  const sort = Number(body.sort ?? 0);
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Укажите название";
  if (!Number.isFinite(sort) || !Number.isInteger(sort) || sort < 0) {
    errors.sort = "Порядок — целое число от 0";
  }
  if (parentId && !(await prisma.category.findUnique({ where: { id: parentId } }))) {
    errors.parentId = "Родитель не найден";
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Проверьте поля", errors }, { status: 400 });
  }

  const taken = new Set((await prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug));
  const slug = uniqueSlug(String(body.slug || name), taken);
  const category = await prisma.category.create({
    data: { name, slug, parentId, sort },
  });
  return NextResponse.json({ category: serializeCategory(category) }, { status: 201 });
}
