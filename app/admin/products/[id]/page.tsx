import type { Metadata } from "next";
import { AdminProductFormScreen } from "@/components/admin-product-form-screen";

export const metadata: Metadata = { title: "Товар - Админка" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProductFormScreen productId={id} />;
}
