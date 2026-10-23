import type { Metadata } from "next";
import { AccountScreen } from "@/components/account-screen";

export const metadata: Metadata = { title: "Кабинет" };

export default function Page() {
  return <AccountScreen />;
}
