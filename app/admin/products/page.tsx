import type { Metadata } from "next";
import { AdminProductsScreen } from "@/components/admin-products-screen";

export const metadata: Metadata = { title: "Товары - Админка" };

export default function Page() {
  return <AdminProductsScreen />;
}
