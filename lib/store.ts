import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sha256 } from "@/lib/hash";
import { createSeed } from "@/lib/seed";
import { demoAdminPassword } from "@/lib/site";
import type { Cart, ShopData } from "@/lib/types";

type ShopState = ShopData & {
  ready: boolean;
  failed: boolean;
  ensureSeed: () => Promise<void>;
  addToCart: (productId: string, qty: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  toggleCompare: (productId: string) => boolean;
};

const empty: ShopData = {
  users: [],
  categories: [],
  products: [],
  specs: [],
  banners: [],
  carts: [],
  cartItems: [],
  orders: [],
  orderItems: [],
  loginAttempts: [],
  compareIds: [],
  guestId: "",
};

let seeding: Promise<void> | null = null;

function guestCart(carts: Cart[]) {
  return carts.find((cart) => cart.userId === null) ?? null;
}

function withGuestCart(state: ShopData) {
  const found = guestCart(state.carts);
  if (found) return { carts: state.carts, cartId: found.id };
  const cartId = `cart-${state.guestId || "guest"}`;
  return { carts: [...state.carts, { id: cartId, userId: null }], cartId };
}

export function guestLines(state: Pick<ShopData, "carts" | "cartItems">) {
  const cart = guestCart(state.carts);
  if (!cart) return [];
  return state.cartItems.filter((item) => item.cartId === cart.id);
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      ...empty,
      ready: false,
      failed: false,
      ensureSeed: () => {
        if (!seeding) {
          seeding = (async () => {
            if (!get().guestId) set({ guestId: crypto.randomUUID() });
            const passwordHash = await sha256(demoAdminPassword);
            const seed = createSeed(passwordHash);
            if (get().products.length === seed.products.length) return;
            const ids = new Set(seed.products.map((product) => product.id));
            set({
              ...seed,
              guestId: get().guestId || crypto.randomUUID(),
              carts: get().carts,
              cartItems: get().cartItems.filter((item) => ids.has(item.productId)),
              compareIds: get().compareIds.filter((id) => ids.has(id)),
            });
          })().finally(() => {
            seeding = null;
          });
        }
        return seeding;
      },
      addToCart: (productId, qty) => {
        const product = get().products.find((item) => item.id === productId && item.published);
        if (!product || product.stock <= 0 || qty < 1) return;
        set((state) => {
          const { carts, cartId } = withGuestCart(state);
          const current = state.cartItems.find((item) => item.cartId === cartId && item.productId === productId);
          const nextQty = Math.min(product.stock, (current?.qty ?? 0) + qty);
          const cartItems = state.cartItems.filter(
            (item) => !(item.cartId === cartId && item.productId === productId),
          );
          cartItems.push({
            id: current?.id ?? `line-${cartId}-${productId}`,
            cartId,
            productId,
            qty: nextQty,
          });
          return { carts, cartItems };
        });
      },
      setQty: (productId, qty) => {
        const product = get().products.find((item) => item.id === productId);
        if (!product) return;
        const nextQty = Math.max(0, Math.min(product.stock, Math.floor(qty)));
        set((state) => {
          const cart = guestCart(state.carts);
          if (!cart) {
            if (nextQty <= 0) return state;
            const { carts, cartId } = withGuestCart(state);
            return {
              carts,
              cartItems: [
                ...state.cartItems,
                { id: `line-${cartId}-${productId}`, cartId, productId, qty: nextQty },
              ],
            };
          }
          const cartItems = state.cartItems.filter(
            (item) => !(item.cartId === cart.id && item.productId === productId),
          );
          if (nextQty > 0) {
            cartItems.push({
              id: `line-${cart.id}-${productId}`,
              cartId: cart.id,
              productId,
              qty: nextQty,
            });
          }
          return { cartItems };
        });
      },
      removeFromCart: (productId) => {
        set((state) => {
          const cart = guestCart(state.carts);
          if (!cart) return state;
          return {
            cartItems: state.cartItems.filter(
              (item) => !(item.cartId === cart.id && item.productId === productId),
            ),
          };
        });
      },
      toggleCompare: (productId) => {
        const ids = get().compareIds;
        if (ids.includes(productId)) {
          set({ compareIds: ids.filter((id) => id !== productId) });
          return true;
        }
        if (ids.length >= 4) return false;
        set({ compareIds: [...ids, productId] });
        return true;
      },
    }),
    {
      name: "volta-shop-v2",
      skipHydration: true,
      partialize: (state) => ({
        users: state.users,
        categories: state.categories,
        products: state.products,
        specs: state.specs,
        banners: state.banners,
        carts: state.carts,
        cartItems: state.cartItems,
        orders: state.orders,
        orderItems: state.orderItems,
        loginAttempts: state.loginAttempts,
        compareIds: state.compareIds,
        guestId: state.guestId,
      }),
    },
  ),
);
