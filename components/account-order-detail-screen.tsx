"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AccountNav } from "@/components/account-nav";
import { Container } from "@/components/container";
import { PayOrderButton } from "@/components/pay-order-button";
import { controlClass } from "@/components/ui";
import {
  deliveryMethodLabel,
  formatOrderDate,
  formatPrice,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/format";
import { pickupAddress } from "@/lib/site";
import { currentUser, orderWithItems, useShop } from "@/lib/store";

export function AccountOrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const payCancel = params.get("pay") === "cancel";
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const orders = useShop((state) => state.orders);
  const orderItems = useShop((state) => state.orderItems);
  const products = useShop((state) => state.products);
  const markPaymentFailed = useShop((state) => state.markPaymentFailed);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);
  const packed = useMemo(
    () => orderWithItems({ orders, orderItems }, orderId),
    [orders, orderItems, orderId],
  );
  const own = packed && user && packed.order.userId === user.id ? packed : null;

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?next=/account/orders/${orderId}`);
    }
  }, [ready, user, router, orderId]);

  useEffect(() => {
    if (payCancel && own?.order.paymentStatus === "pending") {
      markPaymentFailed(orderId);
    }
  }, [payCancel, own, orderId, markPaymentFailed]);

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

  if (!ready || !user) {
    return (
      <Container className="py-8">
        <div className="h-10 w-48 rounded-[10px] bg-elevated" />
        <div className="mt-6 h-40 rounded-[16px] bg-elevated" />
      </Container>
    );
  }

  if (!own) {
    return (
      <Container className="py-8">
        <h1 className="text-[32px] font-bold lg:text-[40px]">Заказ не найден</h1>
        <div className="mt-6">
          <AccountNav />
        </div>
        <p className="mt-8">Такого заказа нет или он принадлежит другому аккаунту.</p>
        <Link href="/account/orders" className={`${controlClass()} mt-6`}>
          К списку заказов
        </Link>
      </Container>
    );
  }

  const { order, items } = own;
  const deliveryPlace =
    order.deliveryMethod === "pickup" ? pickupAddress : order.addressLine;

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Заказ №{order.number}</h1>
      <div className="mt-6">
        <AccountNav />
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[13px] text-fg-soft">Дата</dt>
          <dd className="mt-1 font-semibold">{formatOrderDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-fg-soft">Статус</dt>
          <dd className="mt-1 font-semibold">{orderStatusLabel(order.status)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-fg-soft">Получение</dt>
          <dd className="mt-1 font-semibold">{deliveryMethodLabel(order.deliveryMethod)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-fg-soft">Оплата</dt>
          <dd className="mt-1 font-semibold">{paymentStatusLabel(order.paymentStatus)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-fg-soft">Получатель</dt>
          <dd className="mt-1 font-semibold">{order.recipientName}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-fg-soft">Телефон</dt>
          <dd className="mt-1 font-semibold">{order.phone}</dd>
        </div>
        {deliveryPlace ? (
          <div className="sm:col-span-2">
            <dt className="text-[13px] text-fg-soft">Адрес</dt>
            <dd className="mt-1 font-semibold">{deliveryPlace}</dd>
          </div>
        ) : null}
        {order.comment ? (
          <div className="sm:col-span-2">
            <dt className="text-[13px] text-fg-soft">Комментарий</dt>
            <dd className="mt-1">{order.comment}</dd>
          </div>
        ) : null}
      </dl>

      <h2 className="mt-10 text-[22px] font-bold">Состав</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {items.map((item) => {
          const product = products.find((row) => row.id === item.productId);
          const lineSum = item.price * item.qty;
          return (
            <li key={item.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {product?.published ? (
                  <Link href={`/product/${product.slug}`} className="font-semibold">
                    {item.name}
                  </Link>
                ) : (
                  <p className="font-semibold">{item.name}</p>
                )}
                <p className="mt-1 text-[13px] text-fg-soft">
                  {item.qty} × {formatPrice(item.price)}
                </p>
              </div>
              <p className="text-[18px] font-bold">{formatPrice(lineSum)}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 max-w-sm space-y-2">
        <div className="flex justify-between gap-4">
          <span className="text-fg-soft">Товары</span>
          <span>{formatPrice(order.itemsTotal)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-fg-soft">Доставка</span>
          <span>{order.deliveryFee === 0 ? "Бесплатно" : formatPrice(order.deliveryFee)}</span>
        </div>
        <div className="flex justify-between gap-4 text-[18px] font-bold">
          <span>Итого</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {payCancel && order.paymentStatus !== "paid" ? (
        <p className="mt-6 text-[13px]">Оплата отменена. Можно попробовать снова.</p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <PayOrderButton order={order} email={user.email} />
        <Link href="/account/orders" className={controlClass("ghost")}>
          К списку заказов
        </Link>
      </div>
    </Container>
  );
}
