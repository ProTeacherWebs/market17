import type { Metadata } from "next";
import { ProductScreen } from "@/components/product-screen";

export const metadata: Metadata = { title: "Товар" };

export default function Page() {
  return <ProductScreen />;
}
