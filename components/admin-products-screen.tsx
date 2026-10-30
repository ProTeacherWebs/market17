"use client";

import Link from "next/link";
import { useMemo } from "react";
import { controlClass } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { useShop } from "@/lib/store";

export function AdminProductsScreen() {
  const products = useShop((state) => state.products);
  const categories = useShop((state) => state.categories);
  const list = useMemo(
    () => [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [products],
  );
  const categoryName = (id: string) =>
    categories.find((item) => item.id === id)?.name ?? "—";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold lg:text-[32px]">Товары</h1>
        <Link href="/admin/products/new" className={controlClass()}>
          Новый товар
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="mt-8 text-fg-soft">Товаров нет.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {list.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex flex-col gap-1 py-4 transition-opacity hover:opacity-80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{product.name}</p>
                  <p className="mt-1 text-[13px] text-fg-soft">
                    {categoryName(product.categoryId)} · остаток {product.stock}
                    {product.published ? "" : " · скрыт"}
                  </p>
                </div>
                <p className="text-[18px] font-bold">{formatPrice(product.price)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
