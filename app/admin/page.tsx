import type { Metadata } from "next";
import { AdminDashboardScreen } from "@/components/admin-dashboard-screen";

export const metadata: Metadata = { title: "Админка" };

export default function Page() {
  return <AdminDashboardScreen />;
}
