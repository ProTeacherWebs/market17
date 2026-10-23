import type { Metadata } from "next";
import { CompareScreen } from "@/components/compare-screen";

export const metadata: Metadata = { title: "Сравнение" };

export default function Page() {
  return <CompareScreen />;
}
