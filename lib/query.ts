import { discountPercent, readInt } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const pageSize = 12;

const sorts = new Set(["new", "price_asc", "price_desc", "discount"]);

export type ProductQuery = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
  brands: string[];
  missingCategory: boolean;
  shortQuery: boolean;
};

export function categoryTree(categories: Category[]) {
  return categories
    .filter((category) => category.parentId === null)
    .sort((a, b) => a.sort - b.sort)
    .map((parent) => ({
      ...parent,
      children: categories
        .filter((category) => category.parentId === parent.id)
        .sort((a, b) => a.sort - b.sort),
    }));
}

export function queryProducts(
  products: Product[],
  categories: Category[],
  params: URLSearchParams,
  options: { categorySlug?: string; forcedSale?: boolean; search?: boolean },
): ProductQuery {
  const category = options.categorySlug
    ? categories.find((item) => item.slug === options.categorySlug)
    : undefined;

  if (options.categorySlug && !category) {
    return { items: [], total: 0, page: 1, pages: 1, brands: [], missingCategory: true, shortQuery: false };
  }

  const ids = new Set<string>();
  if (category) {
    ids.add(category.id);
    for (const item of categories) {
      if (item.parentId === category.id) ids.add(item.id);
    }
  }

  const q = (params.get("q") ?? "").trim().slice(0, 80);
  if (options.search && q.length < 2) {
    return { items: [], total: 0, page: 1, pages: 1, brands: [], missingCategory: false, shortQuery: true };
  }

  let scoped = products.filter((product) => product.published);
  if (category) scoped = scoped.filter((product) => ids.has(product.categoryId));

  const brands = [...new Set(scoped.map((product) => product.brand))].sort((a, b) => a.localeCompare(b, "ru"));

  const brand = params.get("brand");
  const min = readInt(params.get("min"));
  const max = readInt(params.get("max"));
  const inStock = params.get("stock") === "1";
  const sale = options.forcedSale || params.get("sale") === "1";
  const sort = sorts.has(params.get("sort") ?? "") ? (params.get("sort") as string) : "new";
  const requested = readInt(params.get("page")) ?? 1;

  if (q.length >= 2) {
    const needle = q.toLocaleLowerCase("ru");
    scoped = scoped.filter(
      (product) =>
        product.name.toLocaleLowerCase("ru").includes(needle) ||
        product.brand.toLocaleLowerCase("ru").includes(needle),
    );
  }

  if (brand) scoped = scoped.filter((product) => product.brand === brand);
  if (min !== null) scoped = scoped.filter((product) => product.price >= min);
  if (max !== null) scoped = scoped.filter((product) => product.price <= max);
  if (inStock) scoped = scoped.filter((product) => product.stock > 0);
  if (sale) scoped = scoped.filter((product) => discountPercent(product.price, product.compareAtPrice) > 0);

  const sorted = [...scoped].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "discount") {
      return discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const page = Math.max(1, requested);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const items = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    items,
    total: sorted.length,
    page,
    pages,
    brands,
    missingCategory: false,
    shortQuery: false,
  };
}

export function relatedProducts(products: Product[], product: Product) {
  return products
    .filter((item) => item.published && item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, 4);
}
