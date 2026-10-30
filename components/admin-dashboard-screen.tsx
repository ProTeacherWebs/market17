"use client";

import Link from "next/link";
import { useMemo } from "react";
import { adminStats, useShop } from "@/lib/store";

const cards = [
  { key: "ordersToday" as const, label: "Заказы сегодня", href: "/admin/orders" },
  { key: "pendingPayment" as const, label: "Ждут оплату", href: "/admin/orders" },
  { key: "outOfStock" as const, label: "Нет в наличии", href: "/admin/products" },
  { key: "users" as const, label: "Пользователи", href: "/admin" },
];

export function AdminDashboardScreen() {
  const orders = useShop((state) => state.orders);
  const products = useShop((state) => state.products);
  const users = useShop((state) => state.users);
  const stats = useMemo(() => adminStats({ orders, products, users }), [orders, products, users]);

  return (
    <div>
      <h1 className="text-[28px] font-bold lg:text-[32px]">Сводка</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-[16px] border border-line bg-elevated p-5 transition-opacity hover:opacity-90"
          >
            <p className="text-[13px] text-fg-soft">{card.label}</p>
            <p className="mt-2 text-[32px] font-bold tabular-nums">{stats[card.key]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
