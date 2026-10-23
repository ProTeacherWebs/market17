import type { Metadata } from "next";
import { FavoritesScreen } from "@/components/favorites-screen";

export const metadata: Metadata = { title: "Избранное" };

export default function Page() {
  return <FavoritesScreen />;
}
