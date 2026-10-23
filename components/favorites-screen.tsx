"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { controlClass } from "@/components/ui";
import { currentUser, useShop } from "@/lib/store";

export function FavoritesScreen() {
  const router = useRouter();
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const favorites = useShop((state) => state.favorites);
  const products = useShop((state) => state.products);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/favorites");
  }, [ready, user, router]);

  if (failed) {
    return (
      <Container className="py-16">
        <p>Не удалось загрузить. Повторите.</p>
        <button type="button" className={`${controlClass()} mt-6`} onClick={() => window.location.reload()}>
          Повторить
        </button>
      </Container>
    );
  }

  if (!ready || !user) {
    return (
      <Container className="py-8">
        <div className="h-10 w-48 rounded-[10px] bg-elevated" />
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aspect-square rounded-[16px] bg-elevated" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  const items = favorites
    .filter((item) => item.userId === user.id)
    .map((item) => products.find((product) => product.id === item.productId && product.published))
    .filter((product) => product !== undefined);

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Избранное</h1>
      {items.length === 0 ? (
        <div className="mt-6">
          <p>В избранном пока пусто</p>
          <Link href="/catalog" className={`${controlClass()} mt-6`}>
            В каталог
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
