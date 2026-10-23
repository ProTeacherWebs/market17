"use client";

import { Heart, Minus, Plus } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/container";
import { NotFoundBlock } from "@/components/not-found-block";
import { ProductCard } from "@/components/product-card";
import { Button, controlClass } from "@/components/ui";
import { discountLabel, discountPercent, formatPrice } from "@/lib/format";
import { relatedProducts } from "@/lib/query";
import { guestLines, useShop } from "@/lib/store";

export function ProductScreen() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const reduce = useReducedMotion();
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const products = useShop((state) => state.products);
  const specs = useShop((state) => state.specs);
  const compareIds = useShop((state) => state.compareIds);
  const carts = useShop((state) => state.carts);
  const cartItems = useShop((state) => state.cartItems);
  const lines = useMemo(() => guestLines({ carts, cartItems }), [carts, cartItems]);
  const addToCart = useShop((state) => state.addToCart);
  const toggleCompare = useShop((state) => state.toggleCompare);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [compareNote, setCompareNote] = useState("");
  const [seenSlug, setSeenSlug] = useState(slug);
  if (slug !== seenSlug) {
    setSeenSlug(slug);
    setPhoto(0);
    setQty(1);
    setCompareNote("");
  }

  const product = products.find((item) => item.slug === slug && item.published);

  useEffect(() => {
    if (product) document.title = `${product.name} - VOLTA`;
  }, [product]);

  const groups = useMemo(() => {
    if (!product) return [];
    const rows = specs
      .filter((spec) => spec.productId === product.id)
      .sort((a, b) => a.sort - b.sort);
    const map = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [product, specs]);

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
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-[16px] bg-elevated" />
          <div className="space-y-3">
            <div className="h-10 w-2/3 rounded-[10px] bg-elevated" />
            <div className="h-8 w-1/3 rounded-[10px] bg-elevated" />
            <div className="h-11 w-40 rounded-full bg-elevated" />
          </div>
        </div>
      </Container>
    );
  }

  if (!product) return <NotFoundBlock />;

  const discount = discountPercent(product.price, product.compareAtPrice);
  const inCart = lines.find((line) => line.productId === product.id)?.qty ?? 0;
  const room = Math.max(0, product.stock - inCart);
  const related = relatedProducts(products, product);
  const compared = compareIds.includes(product.id);

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-[16px] bg-elevated">
            <AnimatePresence initial={false}>
              <motion.div
                key={product.images[photo]}
                className="absolute inset-0"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
              >
                <Image
                  src={product.images[photo]}
                  alt={product.name}
                  fill
                  unoptimized
                  priority={photo === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-2">
            {product.images.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Фото ${index + 1}`}
                onClick={() => setPhoto(index)}
                className={`relative h-16 w-16 overflow-hidden rounded-[10px] border ${index === photo ? "border-fg" : "border-line"}`}
              >
                <Image src={src} alt="" fill unoptimized className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-[32px] font-bold leading-tight lg:text-[40px]">{product.name}</h1>
          <p className="mt-3 max-w-[65ch] leading-normal text-fg-soft">{product.description}</p>
          <p className="mt-6 text-[18px] font-bold">{formatPrice(product.price)}</p>
          {discount > 0 && product.compareAtPrice ? (
            <p className="mt-1 text-fg-soft line-through">{formatPrice(product.compareAtPrice)}</p>
          ) : null}
          {discount > 0 ? <p className="mt-2 text-[13px] font-semibold text-sale">{discountLabel(discount)}</p> : null}
          <p className="mt-4 text-fg-soft">
            {product.stock > 0 ? `В наличии ${product.stock} шт.` : "Нет в наличии"}
          </p>
          {room > 0 ? (
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                aria-label="Уменьшить"
                className="grid h-11 w-11 place-items-center rounded-full border border-line"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
              >
                <Minus size={18} weight="regular" />
              </button>
              <span className="w-8 text-center font-semibold">{Math.min(qty, room)}</span>
              <button
                type="button"
                aria-label="Увеличить"
                disabled={qty >= room}
                className="grid h-11 w-11 place-items-center rounded-full border border-line disabled:opacity-40"
                onClick={() => setQty((value) => Math.min(room, value + 1))}
              >
                <Plus size={18} weight="regular" />
              </button>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={room <= 0}
              onClick={() => addToCart(product.id, Math.min(qty, room))}
            >
              {product.stock === 0 ? "Нет в наличии" : room === 0 ? "В корзине максимум" : "В корзину"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const added = toggleCompare(product.id);
                setCompareNote(added ? "" : "Можно сравнить 4 товара");
              }}
            >
              {compared ? "В сравнении" : "В сравнение"}
            </Button>
            <Link href="/login" className={controlClass("ghost")}>
              <Heart size={18} weight="regular" />
              В избранное
            </Link>
          </div>
          {inCart > 0 ? <p className="mt-3 text-[13px] text-fg-soft">В корзине {inCart} шт.</p> : null}
          {compareNote ? <p className="mt-2 text-[13px]">{compareNote}</p> : null}
        </div>
      </div>
      <section className="mt-12">
        <h2 className="text-[32px] font-bold">Характеристики</h2>
        <div className="mt-6 space-y-8">
          {groups.map(([group, rows]) => (
            <div key={group}>
              <h3 className="font-semibold">{group}</h3>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.id} className="rounded-[16px] bg-elevated px-4 py-3">
                    <dt className="text-[13px] font-medium text-fg-soft">{row.name}</dt>
                    <dd className="mt-1">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-[32px] font-bold">Похожие</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
