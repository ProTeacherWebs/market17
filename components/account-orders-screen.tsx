"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AccountNav } from "@/components/account-nav";
import { Container } from "@/components/container";
import { controlClass } from "@/components/ui";
import {
  formatOrderDate,
  formatPrice,
  orderStatusLabel,
} from "@/lib/format";
import { currentUser, useShop, userOrders } from "@/lib/store";

export function AccountOrdersScreen() {
  const router = useRouter();
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const orders = useShop((state) => state.orders);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);
  const list = useMemo(
    () => userOrders({ orders, sessionUserId }),
    [orders, sessionUserId],
  );

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account/orders");
  }, [ready, user, router]);

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
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Заказы</h1>
      <div className="mt-6">
        <AccountNav />
      </div>
      {list.length === 0 ? (
        <div className="mt-8">
          <p>Заказов пока нет</p>
          <Link href="/catalog" className={`${controlClass()} mt-6`}>
            В каталог
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {list.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-col gap-2 py-4 transition-opacity hover:opacity-80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">№{order.number}</p>
                  <p className="mt-1 text-[13px] text-fg-soft">{formatOrderDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <span className="text-[13px] text-fg-soft">{orderStatusLabel(order.status)}</span>
                  <span className="text-[18px] font-bold">{formatPrice(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
