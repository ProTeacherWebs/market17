"use client";

import { useEffect, type ReactNode } from "react";
import { useShop } from "@/lib/store";

export function ShopRoot({ children }: { children: ReactNode }) {
  const boot = useShop((state) => state.ensureSeed);
  useEffect(() => {
    let cancel = false;
    async function run() {
      try {
        await useShop.persist.rehydrate();
        await boot();
        if (!cancel) useShop.setState({ ready: true, failed: false });
      } catch {
        if (!cancel) useShop.setState({ failed: true, ready: false });
      }
    }
    void run();
    return () => {
      cancel = true;
    };
  }, [boot]);

  return children;
}
