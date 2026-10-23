"use client";

import { X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Container } from "@/components/container";
import { controlClass } from "@/components/ui";
import { discountPercent, formatPrice } from "@/lib/format";
import { useShop } from "@/lib/store";

export function CompareScreen() {
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const products = useShop((state) => state.products);
  const specs = useShop((state) => state.specs);
  const compareIds = useShop((state) => state.compareIds);
  const toggleCompare = useShop((state) => state.toggleCompare);

  const items = useMemo(
    () =>
      compareIds
        .map((id) => products.find((product) => product.id === id && product.published))
        .filter((product) => product !== undefined),
    [compareIds, products],
  );

  const rows = useMemo(() => {
    const map = new Map<string, { group: string; name: string; values: Record<string, string> }>();
    for (const product of items) {
      const productSpecs = specs
        .filter((spec) => spec.productId === product.id)
        .sort((a, b) => a.sort - b.sort);
      for (const spec of productSpecs) {
        const key = `${spec.group}::${spec.name}`;
        const row = map.get(key) ?? { group: spec.group, name: spec.name, values: {} };
        row.values[product.id] = spec.value;
        map.set(key, row);
      }
    }
    return [...map.values()];
  }, [items, specs]);

  if (failed) {
    return (
      <Container className="py-16">
        <p>Не удалось загрузить. Повторите.</p>
        <button type="button" className={`${controlClass()} mt-6`} onClick={() => window.location.reload()}>
          Повторить
        </button>
      </Container>
    );
  }

  if (!ready) {
    return (
      <Container className="py-8">
        <div className="h-10 w-48 rounded-[10px] bg-elevated" />
        <div className="mt-6 h-64 rounded-[16px] bg-elevated" />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Сравнение</h1>
      {items.length === 0 ? (
        <div className="mt-6">
          <p>Добавьте товары из каталога. Можно сравнить до 4 моделей.</p>
          <Link href="/catalog" className={`${controlClass()} mt-6`}>
            В каталог
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[140px] bg-bg px-3 py-3 text-[13px] font-medium text-fg-soft">
                  Параметр
                </th>
                {items.map((product) => (
                  <th key={product.id} className="min-w-[180px] px-3 py-3 align-top">
                    <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-[16px] bg-elevated">
                      <Image src={product.images[0]} alt="" fill unoptimized className="object-cover" sizes="112px" />
                    </div>
                    <Link href={`/product/${product.slug}`} className="mt-3 block text-[16px] font-semibold leading-snug">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-[18px] font-bold">{formatPrice(product.price)}</p>
                    {discountPercent(product.price, product.compareAtPrice) > 0 && product.compareAtPrice ? (
                      <p className="text-[13px] text-fg-soft line-through">{formatPrice(product.compareAtPrice)}</p>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Убрать ${product.name}`}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 text-[13px] text-fg-soft"
                      onClick={() => toggleCompare(product.id)}
                    >
                      <X size={16} weight="regular" />
                      Убрать
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <th className="sticky left-0 bg-bg px-3 py-3 text-[13px] font-medium text-fg-soft">Наличие</th>
                {items.map((product) => (
                  <td key={product.id} className="px-3 py-3">
                    {product.stock > 0 ? `В наличии ${product.stock} шт.` : "Нет в наличии"}
                  </td>
                ))}
              </tr>
              {rows.map((row) => (
                <tr key={`${row.group}-${row.name}`} className="border-t border-line">
                  <th className="sticky left-0 bg-bg px-3 py-3 text-[13px] font-medium text-fg-soft">
                    <span className="block text-fg-soft">{row.group}</span>
                    <span className="text-fg">{row.name}</span>
                  </th>
                  {items.map((product) => (
                    <td key={product.id} className="px-3 py-3">
                      {row.values[product.id] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
