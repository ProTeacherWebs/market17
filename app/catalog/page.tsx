import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { CatalogScreen } from "@/components/catalog-screen";
import { SkeletonGrid } from "@/components/skeleton-grid";

export const metadata: Metadata = { title: "Каталог" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <SkeletonGrid />
        </Container>
      }
    >
      <CatalogScreen />
    </Suspense>
  );
}
