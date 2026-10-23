import type { ReactNode } from "react";
import { Container } from "@/components/container";

export function TextPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container className="py-10">
      <h1 className="text-[32px] font-bold lg:text-[40px]">{title}</h1>
      <div className="mt-6 max-w-[65ch] space-y-4 text-[16px] leading-normal">{children}</div>
    </Container>
  );
}
