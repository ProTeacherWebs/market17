"use client";

import { Minus, Plus, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Container } from "@/components/container";
import { controlClass } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { activeLines, useShop } from "@/lib/store";

export function CartScreen() {
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const products = useShop((state) => state.products);
  const carts = useShop((state) => state.carts);
  const cartItems = useShop((state) => state.cartItems);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const lines = useMemo(
    () => activeLines({ carts, cartItems, sessionUserId }),
    [carts, cartItems, sessionUserId],
  );
  const setQty = useShop((state) => state.setQty);
  const removeFromCart = useShop((state) => state.removeFromCart);

  if (failed) {
    return (
      <Container className="py-16">
        <h1 className="text-[32px] font-bold lg:text-[40px]">Корзина</h1>
        <p className="mt-4">Не удалось загрузить. Повторите.</p>
        <button type="button" className={`${controlClass()} mt-6`} onClick={() => window.location.reload()}>
          Повторить
        </button>
      </Container>
    );
  }

  if (!ready) {
    return (
      <Container className="py-8">
        <div className="h-10 w-40 rounded-[10px] bg-elevated" />
        <div className="mt-6 h-24 rounded-[16px] bg-elevated" />
        <div className="mt-3 h-24 rounded-[16px] bg-elevated" />
      </Container>
    );
  }

  const rows = lines
    .map((line) => {
      const product = products.find((item) => item.id === line.productId && item.published);
      if (!product) return null;
      return { line, product, sum: product.price * line.qty };
    })
    .filter((row) => row !== null);

  const total = rows.reduce((sum, row) => sum + row.sum, 0);

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Корзина</h1>
      {rows.length === 0 ? (
        <div className="mt-6">
          <p>Корзина пуста</p>
          <Link href="/catalog" className={`${controlClass()} mt-6`}>
            В каталог
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-line">
            {rows.map(({ line, product, sum }) => (
              <li key={line.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[96px_minmax(0,1fr)_auto]">
                <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[16px] bg-elevated">
                  <Image src={product.images[0]} alt="" fill unoptimized className="object-cover" sizes="96px" />
                </Link>
                <div className="min-w-0">
                  <Link href={`/product/${product.slug}`} className="font-semibold">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-fg-soft">{formatPrice(product.price)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Уменьшить"
                      className="grid h-11 w-11 place-items-center rounded-full border border-line"
                      onClick={() => setQty(product.id, line.qty - 1)}
                    >
                      <Minus size={18} weight="regular" />
                    </button>
                    <span className="w-8 text-center font-semibold">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Увеличить"
                      disabled={line.qty >= product.stock}
                      className="grid h-11 w-11 place-items-center rounded-full border border-line disabled:opacity-40"
                      onClick={() => setQty(product.id, line.qty + 1)}
                    >
                      <Plus size={18} weight="regular" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Удалить ${product.name}`}
                      className="grid h-11 w-11 place-items-center"
                      onClick={() => removeFromCart(product.id)}
                    >
                      <Trash size={18} weight="regular" />
                    </button>
                  </div>
                </div>
                <p className="col-span-2 text-[18px] font-bold sm:col-span-1 sm:text-right">{formatPrice(sum)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <span>Итого</span>
            <span className="text-[18px] font-bold">{formatPrice(total)}</span>
          </div>
          <div className="mt-6">
            {sessionUserId ? (
              <Link href="/checkout" className={controlClass()}>
                Оформить заказ
              </Link>
            ) : (
              <Link href="/login?next=/checkout" className={controlClass()}>
                Войти и оформить
              </Link>
            )}
          </div>
        </>
      )}
    </Container>
  );
}
