import type { Metadata } from "next";
import { CartScreen } from "@/components/cart-screen";

export const metadata: Metadata = { title: "Корзина" };

export default function Page() {
  return <CartScreen />;
}
