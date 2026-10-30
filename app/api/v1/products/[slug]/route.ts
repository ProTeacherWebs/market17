import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { serializeProduct, serializeSpec } from "@/lib/serialize";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;

  try {
    const { slug } = await context.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { specs: { orderBy: { sort: "asc" } } },
    });
    if (!product || !product.published) {
      return jsonError("Товар не найден", 404);
    }

    const related = await prisma.product.findMany({
      where: {
        published: true,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      product: serializeProduct(product),
      specs: product.specs.map(serializeSpec),
      related: related.map(serializeProduct),
    });
  } catch {
    return jsonError("Не удалось загрузить товар", 500);
  }
}
