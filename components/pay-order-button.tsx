"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { useShop } from "@/lib/store";
import type { Order } from "@/lib/types";

function readRate(key: string) {
  const raw = (process.env[key] || "").trim();
  const rate = Number(raw);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

function formatUzs(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} сум`;
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function PayOrderButton({ order, email }: { order: Order; email?: string }) {
  const markPaymentPending = useShop((state) => state.markPaymentPending);
  const markPaymentFailed = useShop((state) => state.markPaymentFailed);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const rateUzs = readRate("NEXT_PUBLIC_EXCHANGE_RATE_UZS");
  const rateUsd = readRate("NEXT_PUBLIC_UZS_PER_USD");
  const uzsPreview = rateUzs ? Math.round(order.total * rateUzs) : null;
  const usdCentsPreview =
    uzsPreview != null && rateUsd ? Math.max(1, Math.round((uzsPreview / rateUsd) * 100)) : null;

  if (order.paymentStatus === "paid" || order.status === "cancelled") return null;

  async function pay() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          number: order.number,
          total: order.total,
          email: email || undefined,
        }),
      });
      const data = (await response.json()) as {
        url?: string;
        paymentId?: string;
        error?: string;
      };
      if (!response.ok || !data.url || !data.paymentId) {
        setError(data.error || "Не удалось начать оплату");
        markPaymentFailed(order.id);
        setBusy(false);
        return;
      }
      markPaymentPending(order.id, data.paymentId);
      window.location.href = data.url;
    } catch {
      setError("Сеть недоступна");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={pay} disabled={busy}>
        {busy ? "Переход к оплате…" : "Оплатить картой"}
      </Button>
      {uzsPreview != null && usdCentsPreview != null && rateUzs != null && rateUsd != null ? (
        <p className="text-[13px] text-fg-soft">
          {formatPrice(order.total)} → {formatUzs(uzsPreview)} → {formatUsd(usdCentsPreview)} (курс{" "}
          {rateUzs} сум/₽, {rateUsd} сум/$)
        </p>
      ) : (
        <p className="text-[13px] text-fg-soft">
          В Stripe спишется USD: задайте EXCHANGE_RATE_UZS и UZS_PER_USD
        </p>
      )}
      {error ? <p className="text-[13px]">{error}</p> : null}
    </div>
  );
}
