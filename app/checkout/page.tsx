import type { Metadata } from "next";
import { CheckoutScreen } from "@/components/checkout-screen";

export const metadata: Metadata = { title: "Оформление" };

export default function Page() {
  return <CheckoutScreen />;
}
