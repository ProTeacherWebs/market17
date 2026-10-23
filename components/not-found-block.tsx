import { Container } from "@/components/container";
import { controlClass } from "@/components/ui";
import Link from "next/link";

export function NotFoundBlock() {
  return (
    <Container className="py-16">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Страница не найдена</h1>
      <p className="mt-4 text-fg-soft">Такой страницы нет.</p>
      <Link href="/catalog" className={`${controlClass()} mt-6`}>
        В каталог
      </Link>
    </Container>
  );
}
