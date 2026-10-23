import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterScreen } from "@/components/auth-screens";
import { Container } from "@/components/container";

export const metadata: Metadata = { title: "Регистрация" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <Container className="py-10">
          <div className="mx-auto h-10 w-40 rounded-[10px] bg-elevated" />
        </Container>
      }
    >
      <RegisterScreen />
    </Suspense>
  );
}
