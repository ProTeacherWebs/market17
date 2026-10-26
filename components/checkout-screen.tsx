"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { Button, Field, controlClass, inputClass } from "@/components/ui";
import {
  deliveryFeeFor,
  formatPrice,
} from "@/lib/format";
import { courierFee, freeDeliveryFrom, pickupAddress } from "@/lib/site";
import {
  activeLines,
  currentUser,
  useShop,
  type FieldErrors,
} from "@/lib/store";
import type { DeliveryMethod } from "@/lib/types";

export function CheckoutScreen() {
  const router = useRouter();
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const products = useShop((state) => state.products);
  const carts = useShop((state) => state.carts);
  const cartItems = useShop((state) => state.cartItems);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const placeOrder = useShop((state) => state.placeOrder);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);
  const lines = useMemo(
    () => activeLines({ carts, cartItems, sessionUserId }),
    [carts, cartItems, sessionUserId],
  );

  const [phone, setPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [nameSeeded, setNameSeeded] = useState(false);
  const [method, setMethod] = useState<DeliveryMethod>("courier");
  const [addressLine, setAddressLine] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/checkout");
  }, [ready, user, router]);

  if (user && !nameSeeded) {
    setNameSeeded(true);
    setRecipientName(user.name);
  }

  if (failed) {
    return (
      <Container className="py-16">
        <h1 className="text-[32px] font-bold lg:text-[40px]">Оформление</h1>
        <p className="mt-4">Не удалось загрузить. Повторите.</p>
        <button type="button" className={`${controlClass()} mt-6`} onClick={() => window.location.reload()}>
          Повторить
        </button>
      </Container>
    );
  }

  if (!ready || !user) {
    return (
      <Container className="py-8">
        <div className="h-10 w-48 rounded-[10px] bg-elevated" />
        <div className="mt-6 h-40 rounded-[16px] bg-elevated" />
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

  const itemsTotal = rows.reduce((sum, row) => sum + row.sum, 0);
  const deliveryFee = deliveryFeeFor(itemsTotal, method);
  const total = itemsTotal + deliveryFee;

  if (rows.length === 0) {
    return (
      <Container className="py-8">
        <h1 className="text-[32px] font-bold lg:text-[40px]">Оформление</h1>
        <p className="mt-6">Корзина пуста</p>
        <Link href="/catalog" className={`${controlClass()} mt-6`}>
          В каталог
        </Link>
      </Container>
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = placeOrder({
      phone,
      recipientName,
      deliveryMethod: method,
      addressLine: method === "courier" ? addressLine : null,
      comment: comment || null,
    });
    setBusy(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    router.replace(`/checkout/success?order=${encodeURIComponent(result.orderId)}`);
  }

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Оформление</h1>
      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Field label="Телефон" error={errors.phone}>
            <input
              className={inputClass}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field label="Имя получателя" error={errors.recipientName}>
            <input
              className={inputClass}
              type="text"
              autoComplete="name"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </Field>

          <fieldset>
            <legend className="mb-3 text-[13px] font-medium">Способ получения</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "courier" as const, label: "Курьер" },
                  { value: "pickup" as const, label: "Самовывоз" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    method === option.value
                      ? "inline-flex min-h-11 items-center rounded-full bg-accent px-4 font-semibold text-inverse"
                      : "inline-flex min-h-11 items-center rounded-full border border-line px-4"
                  }
                  onClick={() => setMethod(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {method === "courier" ? (
            <>
              <Field label="Адрес" error={errors.addressLine}>
                <input
                  className={inputClass}
                  type="text"
                  autoComplete="street-address"
                  placeholder="Улица, дом, квартира"
                  value={addressLine}
                  onChange={(event) => setAddressLine(event.target.value)}
                />
              </Field>
              <Field label="Комментарий">
                <textarea
                  className={`${inputClass} h-24 resize-y py-2`}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </Field>
              <p className="text-[13px] text-fg-soft">
                Доставка {formatPrice(courierFee)}, бесплатно от {formatPrice(freeDeliveryFrom)}.
              </p>
            </>
          ) : (
            <p className="text-fg-soft">Самовывоз: {pickupAddress}</p>
          )}

          {errors.form ? <p className="text-[13px]">{errors.form}</p> : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ul className="divide-y divide-line border-y border-line">
            {rows.map(({ product, line, sum }) => (
              <li key={line.id} className="flex gap-3 py-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-elevated">
                  <Image src={product.images[0]} alt="" fill unoptimized className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{product.name}</p>
                  <p className="text-[13px] text-fg-soft">
                    {line.qty} × {formatPrice(product.price)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatPrice(sum)}</p>
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-[15px]">
            <div className="flex justify-between gap-4">
              <span className="text-fg-soft">Товары</span>
              <span>{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-fg-soft">Доставка</span>
              <span>{deliveryFee === 0 ? "Бесплатно" : formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between gap-4 text-[18px] font-bold">
              <span>Итого</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            Подтвердить заказ
          </Button>
          <Link href="/cart" className={`${controlClass("ghost")} w-full`}>
            Назад в корзину
          </Link>
        </aside>
      </form>
    </Container>
  );
}
