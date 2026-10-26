"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PayOrderButton } from "@/components/pay-order-button";
import { Container } from "@/components/container";
import { controlClass } from "@/components/ui";
import { currentUser, orderWithItems, useShop } from "@/lib/store";

export function CheckoutSuccessScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";
  const sessionId = params.get("session_id") ?? "";
  const ready = useShop((state) => state.ready);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const orders = useShop((state) => state.orders);
  const orderItems = useShop((state) => state.orderItems);
  const applyPaidSession = useShop((state) => state.applyPaidSession);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);
  const packed = useMemo(
    () => (orderId ? orderWithItems({ orders, orderItems }, orderId) : null),
    [orderId, orders, orderItems],
  );
  const own = packed && user && packed.order.userId === user.id ? packed.order : null;
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming] = useState(Boolean(sessionId));
  const ran = useRef(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/checkout");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user || !own || !sessionId || ran.current) return;
    ran.current = true;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/v1/payments/confirm?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = (await response.json()) as {
          orderId?: string;
          paymentId?: string;
          amountKopecks?: number;
          paymentStatus?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || data.paymentStatus !== "paid" || !data.paymentId || !data.orderId) {
          setConfirmError(data.error || "Оплата не подтверждена");
          setConfirming(false);
          return;
        }
        if (data.orderId !== own.id) {
          setConfirmError("Сессия относится к другому заказу");
          setConfirming(false);
          return;
        }
        const applied = applyPaidSession({
          orderId: data.orderId,
          paymentId: data.paymentId,
          amountKopecks: data.amountKopecks ?? 0,
        });
        if (!applied.ok) {
          setConfirmError(applied.error);
        }
      } catch {
        if (!cancelled) setConfirmError("Не удалось проверить оплату");
      } finally {
        if (!cancelled) setConfirming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, own, sessionId, applyPaidSession]);

  if (!ready || !user) {
    return (
      <Container className="py-8">
        <div className="h-10 w-56 rounded-[10px] bg-elevated" />
      </Container>
    );
  }

  if (!own) {
    return (
      <Container className="py-8">
        <h1 className="text-[32px] font-bold lg:text-[40px]">Заказ не найден</h1>
        <Link href="/account/orders" className={`${controlClass()} mt-6`}>
          К заказам
        </Link>
      </Container>
    );
  }

  const paid = own.paymentStatus === "paid";

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">
        {paid ? "Оплата прошла" : "Заказ принят"}
      </h1>
      {confirming ? (
        <p className="mt-6 max-w-xl text-[18px]">Проверяем оплату…</p>
      ) : paid ? (
        <p className="mt-6 max-w-xl text-[18px]">
          Заказ №{own.number} оплачен (тест Stripe).
        </p>
      ) : (
        <p className="mt-6 max-w-xl text-[18px]">
          Заказ №{own.number} принят. Можно оплатить картой через Stripe (тест).
        </p>
      )}
      {confirmError ? <p className="mt-4 text-[13px]">{confirmError}</p> : null}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!paid && !confirming ? <PayOrderButton order={own} email={user.email} /> : null}
        <Link href={`/account/orders/${own.id}`} className={controlClass(paid ? "primary" : "ghost")}>
          Открыть заказ
        </Link>
        <Link href="/catalog" className={controlClass("ghost")}>
          В каталог
        </Link>
      </div>
    </Container>
  );
}
