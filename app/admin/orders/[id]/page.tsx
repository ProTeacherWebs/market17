import type { Metadata } from "next";
import { AdminOrderDetailScreen } from "@/components/admin-order-detail-screen";

export const metadata: Metadata = { title: "Заказ - Админка" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOrderDetailScreen orderId={id} />;
}
