import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";
import { pickupAddress } from "@/lib/site";

export const metadata: Metadata = { title: "Гарантия" };

export default function Page() {
  return (
    <TextPage title="Гарантия">
      <p>На технику VOLTA даём 12 месяцев.</p>
      <p>Обмен и ремонт принимают в пункте самовывоза: {pickupAddress}.</p>
    </TextPage>
  );
}
