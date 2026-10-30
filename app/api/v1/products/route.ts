import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { discountPercent, readInt } from "@/lib/format";
import { serializeProduct } from "@/lib/serialize";

const pageSize = 12;

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;

  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const categorySlug = params.get("category")?.trim() || "";
    const q = (params.get("q") ?? "").trim().slice(0, 80);
    const brand = params.get("brand");
    const min = readInt(params.get("min"));
    const max = readInt(params.get("max"));
    const inStock = params.get("stock") === "1";
    const sale = params.get("sale") === "1";
    const sort = params.get("sort") || "new";
    const page = Math.max(1, readInt(params.get("page")) ?? 1);

    const categories = await prisma.category.findMany();
    let categoryIds: string[] | undefined;
    if (categorySlug) {
      const category = categories.find((item) => item.slug === categorySlug);
      if (!category) {
        return NextResponse.json({
          items: [],
          page: 1,
          pages: 1,
          total: 0,
          brands: [],
          missingCategory: true,
        });
      }
      categoryIds = [
        category.id,
        ...categories.filter((item) => item.parentId === category.id).map((item) => item.id),
      ];
    }

    const products = await prisma.product.findMany({
      where: {
        published: true,
        ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
        ...(brand ? { brand } : {}),
        ...(min !== null ? { price: { gte: min } } : {}),
        ...(max !== null ? { price: { ...(min !== null ? { gte: min } : {}), lte: max } } : {}),
        ...(inStock ? { stock: { gt: 0 } } : {}),
      },
    });

    let scoped = products;
    if (q.length >= 2) {
      const needle = q.toLocaleLowerCase("ru");
      scoped = scoped.filter(
        (product) =>
          product.name.toLocaleLowerCase("ru").includes(needle) ||
          product.brand.toLocaleLowerCase("ru").includes(needle),
      );
    } else if (params.has("q") && q.length < 2) {
      return NextResponse.json({
        items: [],
        page: 1,
        pages: 1,
        total: 0,
        brands: [],
        shortQuery: true,
      });
    }

    if (sale) {
      scoped = scoped.filter((product) => discountPercent(product.price, product.compareAtPrice) > 0);
    }

    const brands = [...new Set(scoped.map((product) => product.brand))].sort((a, b) =>
      a.localeCompare(b, "ru"),
    );

    const sorted = [...scoped].sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "discount") {
        return (
          discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice)
        );
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const items = sorted.slice((page - 1) * pageSize, page * pageSize).map(serializeProduct);

    return NextResponse.json({
      items,
      page,
      pages,
      total: sorted.length,
      brands,
      missingCategory: false,
      shortQuery: false,
    });
  } catch {
    return jsonError("Не удалось загрузить товары", 500);
  }
}
