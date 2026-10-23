import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";
import { formatPrice } from "@/lib/format";
import { pickupAddress } from "@/lib/site";

export const metadata: Metadata = { title: "Магазины" };

export default function Page() {
  return (
    <TextPage title="Магазины">
      <p>Самовывоз из одной точки, {formatPrice(0)}.</p>
      <p>{pickupAddress}.</p>
    </TextPage>
  );
}
