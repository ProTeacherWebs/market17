import { courierFee, freeDeliveryFrom } from "@/lib/site";

export function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function discountPercent(price: number, compareAtPrice: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function discountLabel(percent: number) {
  return `−${percent}%`;
}

export function pluralProducts(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
}

export function readInt(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_payment: "Ждёт оплату",
    confirmed: "Подтверждён",
    shipping: "В доставке",
    done: "Выполнен",
    cancelled: "Отменён",
  };
  return map[status] ?? status;
}

export function paymentStatusLabel(status: string) {
  const map: Record<string, string> = {
    unpaid: "Не оплачен",
    pending: "Оплата в процессе",
    paid: "Оплачен",
    failed: "Оплата не прошла",
  };
  return map[status] ?? status;
}

export function deliveryMethodLabel(method: string) {
  if (method === "courier") return "Курьер";
  if (method === "pickup") return "Самовывоз";
  return method;
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function deliveryFeeFor(itemsTotal: number, method: "courier" | "pickup") {
  if (method === "pickup") return 0;
  return itemsTotal >= freeDeliveryFrom ? 0 : courierFee;
}
