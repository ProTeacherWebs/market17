"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AccountNav } from "@/components/account-nav";
import { Container } from "@/components/container";
import { controlClass } from "@/components/ui";
import { currentUser, useShop } from "@/lib/store";

/** Заглушка до S14: история заказов. */
export function AccountOrdersStub() {
  const router = useRouter();
  const ready = useShop((state) => state.ready);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account/orders");
  }, [ready, user, router]);

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
      <div className="mt-8">
        <p>Заказов пока нет</p>
        <Link href="/catalog" className={`${controlClass()} mt-6`}>
          В каталог
        </Link>
      </div>
    </Container>
  );
}
