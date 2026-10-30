"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Field, controlClass, inputClass } from "@/components/ui";
import {
  deliveryMethodLabel,
  formatOrderDate,
  formatPrice,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/format";
import { pickupAddress } from "@/lib/site";
import { orderWithItems, useShop } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "shipping",
  "done",
  "cancelled",
];

export function AdminOrderDetailScreen({ orderId }: { orderId: string }) {
  const orders = useShop((state) => state.orders);
  const orderItems = useShop((state) => state.orderItems);
  const users = useShop((state) => state.users);
  const setOrderStatus = useShop((state) => state.setOrderStatus);
  const packed = useMemo(
    () => orderWithItems({ orders, orderItems }, orderId),
    [orders, orderItems, orderId],
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!packed) {
    return (
      <div>
        <h1 className="text-[28px] font-bold">Заказ не найден</h1>
        <Link href="/admin/orders" className={`${controlClass()} mt-6`}>
          К списку
        </Link>
      </div>
    );
  }

  const { order, items } = packed;
  const buyer = users.find((user) => user.id === order.userId);
  const deliveryPlace =
    order.deliveryMethod === "pickup" ? pickupAddress : order.addressLine;

  return (
    <div>
      <h1 className="text-[28px] font-bold lg:text-[32px]">Заказ №{order.number}</h1>
      <p className="mt-2 text-[13px] text-fg-soft">{formatOrderDate(order.createdAt)}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[13px] text-fg-soft">Покупатель</dt>
          <dd className="mt-1 font-semibold">{buyer?.email ?? order.userId}</dd>
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
        <div>
          <dt className="text-[13px] text-fg-soft">Получение</dt>
          <dd className="mt-1 font-semibold">{deliveryMethodLabel(order.deliveryMethod)}</dd>
        </div>
        {deliveryPlace ? (
          <div>
            <dt className="text-[13px] text-fg-soft">Адрес</dt>
            <dd className="mt-1 font-semibold">{deliveryPlace}</dd>
          </div>
        ) : null}
      </dl>

      <form
        className="mt-8 max-w-md"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const status = String(data.get("status") || "") as OrderStatus;
          const result = setOrderStatus(orderId, status);
          if (!result.ok) {
            setError(result.errors.form || "Не удалось сохранить");
            setSaved(false);
            return;
          }
          setError("");
          setSaved(true);
        }}
      >
        <Field label="Статус" error={error}>
          <select name="status" defaultValue={order.status} className={inputClass} key={order.status}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabel(status)}
              </option>
            ))}
          </select>
        </Field>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit">Сохранить статус</Button>
          {saved ? <span className="text-[13px] text-fg-soft">Сохранено</span> : null}
        </div>
      </form>

      <h2 className="mt-10 text-[22px] font-bold">Состав</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-3">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="mt-1 text-[13px] text-fg-soft">
                {item.qty} × {formatPrice(item.price)}
              </p>
            </div>
            <p className="font-bold">{formatPrice(item.price * item.qty)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 max-w-sm space-y-2">
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

      <Link href="/admin/orders" className={`${controlClass("ghost")} mt-8`}>
        К списку заказов
      </Link>
    </div>
  );
}
