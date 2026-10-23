"use client";

import { List, MagnifyingGlass, Scales, Heart, ShoppingCart, User } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CatalogMenu } from "@/components/catalog-menu";
import { seedCategories } from "@/lib/seed";
import { activeLines, currentUser, useShop } from "@/lib/store";

function CartBadge({ count }: { count: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={count}
      className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-inverse"
      initial={reduce ? false : { scale: 0.6 }}
      animate={{ scale: 1 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 28 }}
    >
      {count}
    </motion.span>
  );
}

export function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center px-4 md:px-6 lg:px-8">
        <span className="text-[20px] font-bold tracking-[-0.03em]">VOLTA</span>
      </div>
    </header>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ready = useShop((state) => state.ready);
  const stored = useShop((state) => state.categories);
  const carts = useShop((state) => state.carts);
  const cartItems = useShop((state) => state.cartItems);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);
  const count = useMemo(
    () => activeLines({ carts, cartItems, sessionUserId }).reduce((sum, item) => sum + item.qty, 0),
    [carts, cartItems, sessionUserId],
  );
  const categories = ready && stored.length > 0 ? stored : seedCategories;
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const paramQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(paramQuery);
  const [seenQuery, setSeenQuery] = useState(paramQuery);
  if (paramQuery !== seenQuery) {
    setSeenQuery(paramQuery);
    setQuery(paramQuery);
  }

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-[1280px] flex-nowrap items-center gap-2 px-4 md:px-6 lg:gap-5 lg:px-8">
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center lg:hidden"
          aria-label="Каталог"
          aria-expanded={open}
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          <List size={22} weight="regular" />
        </button>
        <Link href="/" className="shrink-0 text-[20px] font-bold tracking-[-0.03em]">
          VOLTA
        </Link>
        <nav className="hidden shrink-0 items-center gap-5 whitespace-nowrap lg:flex">
          <button
            type="button"
            className="text-[16px]"
            aria-expanded={open}
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            Каталог
          </button>
          <Link href="/promo">Акции</Link>
          <Link href="/stores">Магазины</Link>
          <Link href="/delivery">Доставка</Link>
        </nav>
        <form
          className="ml-auto hidden lg:block"
          onSubmit={(event) => {
            event.preventDefault();
            const value = query.trim();
            router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
          }}
        >
          <label className="sr-only" htmlFor="header-search">
            Поиск
          </label>
          <input
            id="header-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название или бренд"
            className="h-11 w-[200px] rounded-full border border-line bg-elevated px-4 text-[16px] text-fg placeholder:text-fg-soft xl:w-[260px]"
          />
        </form>
        <div className="ml-auto flex shrink-0 items-center lg:ml-0">
          <Link href="/search" aria-label="Поиск" className="grid h-11 w-11 place-items-center lg:hidden">
            <MagnifyingGlass size={22} weight="regular" />
          </Link>
          <Link href="/compare" aria-label="Сравнение" className="hidden h-11 w-11 place-items-center lg:grid">
            <Scales size={22} weight="regular" />
          </Link>
          <Link href="/favorites" aria-label="Избранное" className="hidden h-11 w-11 place-items-center lg:grid">
            <Heart size={22} weight="regular" />
          </Link>
          <Link
            href="/cart"
            aria-label={count > 0 ? `Корзина, ${count}` : "Корзина"}
            className="relative grid h-11 w-11 place-items-center"
          >
            <ShoppingCart size={22} weight="regular" />
            {count > 0 ? <CartBadge count={count} /> : null}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? "Кабинет" : "Вход"}
            className="hidden h-11 w-11 place-items-center lg:grid"
          >
            <User size={22} weight="regular" />
          </Link>
        </div>
      </div>
    </header>
    <CatalogMenu open={open} categories={categories} onClose={() => setOpenPath(null)} />
    </>
  );
}
