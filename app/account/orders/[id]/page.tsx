import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountOrderDetailScreen } from "@/components/account-order-detail-screen";
import { Container } from "@/components/container";

export const metadata: Metadata = { title: "Заказ" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <div className="h-10 w-48 rounded-[10px] bg-elevated" />
        </Container>
      }
    >
      <AccountOrderDetailScreen orderId={id} />
    </Suspense>
  );
}
