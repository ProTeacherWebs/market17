"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import { categoryTree } from "@/lib/query";
import { seedCategories } from "@/lib/seed";
import { currentUser, useShop } from "@/lib/store";
import { supportEmail, supportPhone, supportPhoneHref } from "@/lib/site";

export function Footer() {
  const ready = useShop((state) => state.ready);
  const stored = useShop((state) => state.categories);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const user = currentUser({ users, sessionUserId });
  const categories = ready && stored.length > 0 ? stored : seedCategories;
  const parents = categoryTree(categories);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line">
      <Container className="grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-semibold">Каталог</p>
          <div className="mt-3 grid gap-2">
            <Link href="/catalog" className="text-fg-soft">
              Все товары
            </Link>
            {parents.map((parent) => (
              <Link key={parent.id} href={`/catalog/${parent.slug}`} className="text-fg-soft">
                {parent.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold">Покупателям</p>
          <div className="mt-3 grid gap-2">
            <Link href="/delivery" className="text-fg-soft">
              Доставка
            </Link>
            <Link href="/warranty" className="text-fg-soft">
              Гарантия
            </Link>
            <Link href="/stores" className="text-fg-soft">
              Магазины
            </Link>
            <Link href="/contacts" className="text-fg-soft">
              Контакты
            </Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Кабинет</p>
          <div className="mt-3 grid gap-2">
            <Link href={user ? "/account" : "/login"} className="text-fg-soft">
              {user ? "Кабинет" : "Вход"}
            </Link>
            <Link href="/cart" className="text-fg-soft">
              Корзина
            </Link>
            {user ? (
              <Link href="/favorites" className="text-fg-soft">
                Избранное
              </Link>
            ) : null}
            <Link href="/compare" className="text-fg-soft">
              Сравнение
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-fg-soft">
            <a href={supportPhoneHref}>{supportPhone}</a>
          </p>
          <p className="text-[13px] text-fg-soft">
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </p>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="py-4 text-[13px] font-medium text-fg-soft">VOLTA, {year}</Container>
      </div>
    </footer>
  );
}
