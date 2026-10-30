"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { NotFoundBlock } from "@/components/not-found-block";
import { Container } from "@/components/container";
import { controlClass } from "@/components/ui";
import { currentUser, isAdmin, useShop } from "@/lib/store";

const items = [
  { href: "/admin", label: "Сводка", exact: true },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/banners", label: "Баннеры" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const logout = useShop((state) => state.logout);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);
  const admin = useMemo(() => isAdmin({ users, sessionUserId }), [users, sessionUserId]);

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

  if (!ready) {
    return (
      <Container className="py-8">
        <div className="h-10 w-48 rounded-[10px] bg-elevated" />
        <div className="mt-6 h-40 rounded-[16px] bg-elevated" />
      </Container>
    );
  }

  if (!admin) return <NotFoundBlock />;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-6 md:px-6 lg:flex-row lg:px-8 lg:py-8">
      <aside className="shrink-0 lg:w-52">
        <div className="flex items-center justify-between gap-3 lg:block">
          <Link href="/admin" className="text-[20px] font-bold tracking-[-0.03em]">
            VOLTA Admin
          </Link>
          <p className="hidden text-[13px] text-fg-soft lg:mt-2 lg:block">{user?.email}</p>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-6 lg:flex-col lg:overflow-visible lg:pb-0">
          {items.map((item) => {
            const current = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={
                  current
                    ? "inline-flex min-h-11 shrink-0 items-center rounded-full bg-accent px-4 font-semibold text-inverse"
                    : "inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-4"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex flex-wrap gap-2 lg:mt-8 lg:flex-col">
          <Link href="/" className={controlClass("ghost", "justify-start")}>
            На сайт
          </Link>
          <button type="button" className={controlClass("ghost", "justify-start")} onClick={() => logout()}>
            Выйти
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
