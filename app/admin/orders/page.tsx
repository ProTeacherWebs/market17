import type { Metadata } from "next";
import { AdminOrdersScreen } from "@/components/admin-orders-screen";

export const metadata: Metadata = { title: "Заказы - Админка" };

export default function Page() {
  return <AdminOrdersScreen />;
}
