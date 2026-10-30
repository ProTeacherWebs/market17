import type { Metadata } from "next";
import { AdminCategoriesScreen } from "@/components/admin-categories-screen";

export const metadata: Metadata = { title: "Категории - Админка" };

export default function Page() {
  return <AdminCategoriesScreen />;
}
