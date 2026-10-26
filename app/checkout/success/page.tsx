import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessScreen } from "@/components/checkout-success-screen";
import { Container } from "@/components/container";

export const metadata: Metadata = { title: "Заказ принят" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <div className="h-10 w-56 rounded-[10px] bg-elevated" />
        </Container>
      }
    >
      <CheckoutSuccessScreen />
    </Suspense>
  );
}
