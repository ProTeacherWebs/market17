"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/account", label: "Профиль" },
  { href: "/cart", label: "Корзина" },
  { href: "/account/orders", label: "Заказы" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-line pb-4">
      {items.map((item) => {
        const current = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={
              current
                ? "inline-flex min-h-11 items-center rounded-full bg-accent px-4 font-semibold text-inverse"
                : "inline-flex min-h-11 items-center rounded-full border border-line px-4"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
