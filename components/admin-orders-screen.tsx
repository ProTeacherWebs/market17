"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatOrderDate, formatPrice, orderStatusLabel } from "@/lib/format";
import { useShop } from "@/lib/store";

export function AdminOrdersScreen() {
  const orders = useShop((state) => state.orders);
  const users = useShop((state) => state.users);
  const list = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  );

  return (
    <div>
      <h1 className="text-[28px] font-bold lg:text-[32px]">Заказы</h1>
      {list.length === 0 ? (
        <p className="mt-8 text-fg-soft">Заказов пока нет.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {list.map((order) => {
            const buyer = users.find((user) => user.id === order.userId);
            return (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-col gap-2 py-4 transition-opacity hover:opacity-80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">№{order.number}</p>
                    <p className="mt-1 text-[13px] text-fg-soft">
                      {formatOrderDate(order.createdAt)}
                      {buyer ? ` · ${buyer.email}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <span className="text-[13px] text-fg-soft">{orderStatusLabel(order.status)}</span>
                    <span className="text-[18px] font-bold">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
