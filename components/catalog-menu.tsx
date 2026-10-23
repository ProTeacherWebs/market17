"use client";

import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { categoryTree } from "@/lib/query";
import { currentUser, useShop } from "@/lib/store";
import type { Category } from "@/lib/types";

const ease = [0.16, 1, 0.3, 1] as const;

function focusable(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>("a, button, input, select, textarea")].filter(
    (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1 && node.getClientRects().length > 0,
  );
}

export function CatalogMenu({
  open,
  categories,
  onClose,
}: {
  open: boolean;
  categories: Category[];
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const user = currentUser({ users, sessionUserId });
  const links = [
    { href: "/catalog", label: "Все товары" },
    { href: "/promo", label: "Акции" },
    { href: "/stores", label: "Магазины" },
    { href: "/delivery", label: "Доставка" },
    { href: "/compare", label: "Сравнение" },
    { href: "/favorites", label: "Избранное" },
    { href: user ? "/account" : "/login", label: user ? "Кабинет" : "Вход" },
  ];
  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const tree = categoryTree(categories);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const close = () => onCloseRef.current();
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    if (narrow) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const timer = window.setTimeout(() => {
        const panel = mobileRef.current;
        if (panel) focusable(panel)[0]?.focus();
      }, 0);
      function onKey(event: KeyboardEvent) {
        if (event.key === "Escape") {
          close();
          return;
        }
        if (event.key !== "Tab") return;
        const panel = mobileRef.current;
        if (!panel) return;
        const nodes = focusable(panel);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      document.addEventListener("keydown", onKey);
      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = previousOverflow;
        document.removeEventListener("keydown", onKey);
        previous?.focus();
      };
    }

    const timer = window.setTimeout(() => {
      const panel = desktopRef.current;
      if (panel) focusable(panel)[0]?.focus();
    }, 0);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = desktopRef.current;
      if (!panel) return;
      const nodes = focusable(panel);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  const duration = reduce ? 0 : 0.28;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Закрыть каталог"
            className="fixed inset-0 z-50 bg-black/50 lg:top-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            onClick={onClose}
          />
          <motion.div
            ref={mobileRef}
            role="dialog"
            aria-modal="true"
            aria-label="Каталог"
            className="fixed inset-y-0 left-0 z-50 w-[min(100vw-48px,360px)] overflow-y-auto bg-elevated lg:hidden"
            initial={reduce ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 1 } : { x: "-100%" }}
            transition={{ duration, ease }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[20px] font-bold tracking-[-0.03em]">Каталог</p>
              <button type="button" aria-label="Закрыть" onClick={onClose} className="grid h-11 w-11 place-items-center">
                <X size={22} weight="regular" />
              </button>
            </div>
            <nav className="grid px-2 pb-4">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="flex min-h-11 items-center rounded-[10px] px-3">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="px-5 pb-8">
              {tree.map((parent) => (
                <div key={parent.id} className="mt-6">
                  <Link href={`/catalog/${parent.slug}`} className="text-[16px] font-semibold">
                    {parent.name}
                  </Link>
                  <div className="mt-2 grid">
                    {parent.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/catalog/${child.slug}`}
                        className="flex min-h-11 items-center text-fg-soft"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            ref={desktopRef}
            role="dialog"
            aria-modal="true"
            aria-label="Каталог"
            className="fixed inset-x-0 top-16 z-50 hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-elevated shadow-[0_24px_24px_rgb(0_0_0/0.45)] lg:block"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease }}
          >
            <div className="mx-auto flex max-w-[1280px] items-start gap-8 px-8 py-6">
              <button type="button" aria-label="Закрыть" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center">
                <X size={22} weight="regular" />
              </button>
              <div className="grid flex-1 grid-cols-5 gap-6">
                {tree.map((parent) => (
                  <div key={parent.id}>
                    <Link href={`/catalog/${parent.slug}`} className="font-semibold">
                      {parent.name}
                    </Link>
                    <div className="mt-3 grid">
                      {parent.children.map((child) => (
                        <Link key={child.id} href={`/catalog/${child.slug}`} className="flex min-h-11 items-center text-fg-soft">
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
