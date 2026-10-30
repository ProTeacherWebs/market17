import type { Metadata } from "next";
import { AdminProductFormScreen } from "@/components/admin-product-form-screen";

export const metadata: Metadata = { title: "Новый товар - Админка" };

export default function Page() {
  return <AdminProductFormScreen />;
}
