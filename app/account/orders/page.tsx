import type { Metadata } from "next";
import { AccountOrdersStub } from "@/components/account-orders-stub";

export const metadata: Metadata = { title: "Заказы" };

export default function Page() {
  return <AccountOrdersStub />;
}
