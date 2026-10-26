import type { Metadata } from "next";
import { AccountOrdersScreen } from "@/components/account-orders-screen";

export const metadata: Metadata = { title: "Заказы" };

export default function Page() {
  return <AccountOrdersScreen />;
}
