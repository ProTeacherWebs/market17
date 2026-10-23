"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/container";
import { NotFoundBlock } from "@/components/not-found-block";
import { ProductCard } from "@/components/product-card";
import { SkeletonGrid } from "@/components/skeleton-grid";
import { controlClass, inputClass } from "@/components/ui";
import { pluralProducts } from "@/lib/format";
import { queryProducts } from "@/lib/query";
import { useShop } from "@/lib/store";

const sortOptions = [
  ["new", "Сначала новинки"],
  ["price_asc", "Дешевле"],
  ["price_desc", "Дороже"],
  ["discount", "По скидке"],
] as const;

export function CatalogScreen({
  categorySlug,
  forcedSale = false,
  search = false,
  title,
}: {
  categorySlug?: string;
  forcedSale?: boolean;
  search?: boolean;
  title?: string;
}) {
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const products = useShop((state) => state.products);
  const categories = useShop((state) => state.categories);
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function push(patch: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

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
        <div className="mt-8">
          <SkeletonGrid />
        </div>
      </Container>
    );
  }

  const result = queryProducts(products, categories, new URLSearchParams(params.toString()), {
    categorySlug,
    forcedSale,
    search,
  });

  if (result.missingCategory) return <NotFoundBlock />;

  const category = categorySlug ? categories.find((item) => item.slug === categorySlug) : undefined;
  const heading = title ?? category?.name ?? (search ? "Поиск" : "Каталог");
  const pageHref = (page: number) => {
    const next = new URLSearchParams(params.toString());
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const resetHref = (() => {
    if (search) {
      const q = params.get("q");
      return q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname;
    }
    return pathname;
  })();

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">{heading}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <form
          className="grid content-start gap-4"
          key={`${params.get("min") ?? ""}-${params.get("max") ?? ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const min = String(data.get("min") ?? "").trim();
            const max = String(data.get("max") ?? "").trim();
            push({ min: min || null, max: max || null });
          }}
        >
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">Сортировка</span>
            <select
              className={inputClass}
              value={params.get("sort") ?? "new"}
              onChange={(event) => push({ sort: event.target.value === "new" ? null : event.target.value })}
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium">Цена от</span>
              <input className={inputClass} name="min" inputMode="numeric" defaultValue={params.get("min") ?? ""} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium">Цена до</span>
              <input className={inputClass} name="max" inputMode="numeric" defaultValue={params.get("max") ?? ""} />
            </label>
          </div>
          <button type="submit" className={controlClass("ghost")}>
            Показать
          </button>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">Бренд</span>
            <select
              className={inputClass}
              value={params.get("brand") ?? ""}
              onChange={(event) => push({ brand: event.target.value || null })}
            >
              <option value="">Все бренды</option>
              {result.brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={params.get("stock") === "1"}
              onChange={(event) => push({ stock: event.target.checked ? "1" : null })}
            />
            В наличии
          </label>
          {forcedSale ? null : (
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={params.get("sale") === "1"}
                onChange={(event) => push({ sale: event.target.checked ? "1" : null })}
              />
              Со скидкой
            </label>
          )}
        </form>
        <div className="min-w-0">
          {result.shortQuery ? (
            <p>Введите хотя бы 2 символа.</p>
          ) : result.total === 0 ? (
            <div>
              <p>Ничего не нашли</p>
              <Link href={resetHref} className={`${controlClass("ghost")} mt-6`}>
                Сбросить фильтры
              </Link>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-medium text-fg-soft">{pluralProducts(result.total)}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {result.pages > 1 ? (
                <nav className="mt-8 flex flex-wrap gap-2" aria-label="Страницы">
                  {Array.from({ length: result.pages }, (_, index) => {
                    const page = index + 1;
                    const current = page === result.page;
                    return (
                      <Link
                        key={page}
                        href={pageHref(page)}
                        aria-current={current ? "page" : undefined}
                        className={
                          current
                            ? "grid h-11 min-w-11 place-items-center rounded-full bg-accent px-3 font-semibold text-inverse"
                            : "grid h-11 min-w-11 place-items-center rounded-full border border-line px-3"
                        }
                      >
                        {page}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
