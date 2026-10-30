import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import {
  serializeBanner,
  serializeCategory,
  serializeProduct,
  serializeSpec,
} from "@/lib/serialize";

/** Полный снимок витрины для гидрации клиента (слой 2). */
export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  if (!process.env.DATABASE_URL?.trim()) {
    return jsonError("База не настроена (DATABASE_URL)", 503);
  }

  try {
    const [categories, products, specs, banners] = await Promise.all([
      prisma.category.findMany({ orderBy: [{ sort: "asc" }, { name: "asc" }] }),
      prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.productSpec.findMany({ orderBy: { sort: "asc" } }),
      prisma.banner.findMany(),
    ]);
    return NextResponse.json({
      categories: categories.map(serializeCategory),
      products: products.map(serializeProduct),
      specs: specs.map(serializeSpec),
      banners: banners.map(serializeBanner),
    });
  } catch (error) {
    console.error("[bootstrap]", error);
    return jsonError("Не удалось загрузить каталог", 500);
  }
}
