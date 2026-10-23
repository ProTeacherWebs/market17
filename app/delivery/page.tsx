import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";
import { formatPrice } from "@/lib/format";
import { courierFee, freeDeliveryFrom, pickupAddress } from "@/lib/site";

export const metadata: Metadata = { title: "Доставка" };

export default function Page() {
  return (
    <TextPage title="Доставка">
      <p>Курьер по Москве: {formatPrice(courierFee)}. Бесплатно от {formatPrice(freeDeliveryFrom)}.</p>
      <p>Самовывоз: {formatPrice(0)}. {pickupAddress}.</p>
    </TextPage>
  );
}
