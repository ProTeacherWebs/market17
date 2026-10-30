import type { Metadata } from "next";
import { AdminBannersScreen } from "@/components/admin-banners-screen";

export const metadata: Metadata = { title: "Баннеры - Админка" };

export default function Page() {
  return <AdminBannersScreen />;
}
