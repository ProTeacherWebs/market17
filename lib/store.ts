import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  normalizeEmail,
  recentLoginFails,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordRepeat,
} from "@/lib/auth";
import { sha256 } from "@/lib/hash";
import { createSeed } from "@/lib/seed";
import { demoAdminPassword } from "@/lib/site";
import type { Cart, CartItem, Product, ShopData, User } from "@/lib/types";

export type FieldErrors = Record<string, string>;

export type AuthResult = {
  ok: boolean;
  errors: FieldErrors;
  locked?: boolean;
};

type ShopState = ShopData & {
  ready: boolean;
  failed: boolean;
  sessionUserId: string | null;
  ensureSeed: () => Promise<void>;
  register: (input: { name: string; email: string; password: string; repeat: string }) => Promise<AuthResult>;
  login: (input: { email: string; password: string }) => Promise<AuthResult>;
  loginWithGoogle: (input: { email: string; name: string; image: string | null }) => AuthResult;
  logout: () => void;
  updateName: (name: string) => AuthResult;
  changePassword: (input: { current: string; password: string; repeat: string }) => Promise<AuthResult>;
  setPassword: (input: { password: string; repeat: string }) => Promise<AuthResult>;
  setAvatar: (dataUrl: string | null) => void;
  addToCart: (productId: string, qty: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  toggleCompare: (productId: string) => boolean;
  toggleFavorite: (productId: string) => boolean;
};

const empty: ShopData & { sessionUserId: string | null } = {
  users: [],
  categories: [],
  products: [],
  specs: [],
  banners: [],
  carts: [],
  cartItems: [],
  favorites: [],
  orders: [],
  orderItems: [],
  loginAttempts: [],
  compareIds: [],
  guestId: "",
  sessionUserId: null,
};

let seeding: Promise<void> | null = null;

function findCart(carts: Cart[], userId: string | null) {
  return carts.find((cart) => cart.userId === userId) ?? null;
}

function withCart(state: ShopData, userId: string | null) {
  const found = findCart(state.carts, userId);
  if (found) return { carts: state.carts, cartId: found.id };
  const cartId = userId ? `cart-user-${userId}` : `cart-${state.guestId || "guest"}`;
  return { carts: [...state.carts, { id: cartId, userId }], cartId };
}

function linesFor(cartId: string, cartItems: CartItem[]) {
  return cartItems.filter((item) => item.cartId === cartId);
}

function stockOf(products: Product[], productId: string) {
  return products.find((product) => product.id === productId)?.stock ?? 0;
}

function mergeGuestIntoUser(state: ShopData, userId: string): Pick<ShopData, "carts" | "cartItems"> {
  const guest = findCart(state.carts, null);
  const { carts, cartId } = withCart(state, userId);
  if (!guest) return { carts, cartItems: state.cartItems };

  const guestLines = linesFor(guest.id, state.cartItems);
  if (!guestLines.length) return { carts, cartItems: state.cartItems };

  const qtyByProduct = new Map<string, number>();
  for (const item of linesFor(cartId, state.cartItems)) {
    qtyByProduct.set(item.productId, item.qty);
  }
  for (const item of guestLines) {
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty);
  }

  const withoutBoth = state.cartItems.filter((item) => item.cartId !== cartId && item.cartId !== guest.id);
  const merged: CartItem[] = [...withoutBoth];
  for (const [productId, qty] of qtyByProduct) {
    const stock = stockOf(state.products, productId);
    const nextQty = Math.min(stock, qty);
    if (nextQty <= 0) continue;
    merged.push({
      id: `line-${cartId}-${productId}`,
      cartId,
      productId,
      qty: nextQty,
    });
  }
  return { carts, cartItems: merged };
}

export function activeLines(
  state: Pick<ShopData, "carts" | "cartItems"> & { sessionUserId: string | null },
) {
  const cart = findCart(state.carts, state.sessionUserId);
  if (!cart) return [];
  return linesFor(cart.id, state.cartItems);
}

/** @deprecated use activeLines */
export function guestLines(state: Pick<ShopData, "carts" | "cartItems"> & { sessionUserId?: string | null }) {
  return activeLines({ ...state, sessionUserId: state.sessionUserId ?? null });
}

export function currentUser(state: Pick<ShopData, "users"> & { sessionUserId: string | null }): User | null {
  if (!state.sessionUserId) return null;
  return state.users.find((user) => user.id === state.sessionUserId) ?? null;
}

export function isFavorite(
  state: Pick<ShopData, "favorites"> & { sessionUserId: string | null },
  productId: string,
) {
  if (!state.sessionUserId) return false;
  return state.favorites.some((item) => item.userId === state.sessionUserId && item.productId === productId);
}

export function avatarSrc(user: User | null) {
  return user?.image || "/avatars/default.jpg";
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
            const sessionUserId = get().sessionUserId;
            const users = (() => {
              const byEmail = new Map(seed.users.map((user) => [user.email, user]));
              for (const user of get().users) {
                if (!byEmail.has(user.email)) byEmail.set(user.email, user);
              }
              return [...byEmail.values()];
            })();
            const userIds = new Set(users.map((user) => user.id));
            set({
              ...seed,
              guestId: get().guestId || crypto.randomUUID(),
              sessionUserId: sessionUserId && userIds.has(sessionUserId) ? sessionUserId : null,
              carts: get().carts,
              cartItems: get().cartItems.filter((item) => ids.has(item.productId)),
              favorites: (get().favorites ?? []).filter(
                (item) => userIds.has(item.userId) && ids.has(item.productId),
              ),
              compareIds: get().compareIds.filter((id) => ids.has(id)),
              loginAttempts: get().loginAttempts,
              users,
            });
          })().finally(() => {
            seeding = null;
          });
        }
        return seeding;
      },
      register: async ({ name, email, password, repeat }): Promise<AuthResult> => {
        const errors: FieldErrors = {
          name: validateName(name),
          email: validateEmail(email),
          password: validatePassword(password),
          repeat: validatePasswordRepeat(password, repeat),
        };
        const clean: FieldErrors = Object.fromEntries(
          Object.entries(errors).filter(([, value]) => value),
        );
        if (Object.keys(clean).length) return { ok: false, errors: clean };

        const normalized = normalizeEmail(email);
        if (get().users.some((user) => user.email === normalized)) {
          return { ok: false, errors: { email: "Такая почта уже занята" } };
        }

        const passwordHash = await sha256(password);
        const user: User = {
          id: `user-${crypto.randomUUID()}`,
          email: normalized,
          name: name.trim(),
          passwordHash,
          image: null,
          role: "customer",
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const merged = mergeGuestIntoUser(state, user.id);
          return {
            users: [...state.users, user],
            sessionUserId: user.id,
            ...merged,
          };
        });
        return { ok: true, errors: {} };
      },
      login: async ({ email, password }): Promise<AuthResult> => {
        const errors: FieldErrors = {
          email: validateEmail(email),
          password: password ? "" : "Укажите пароль",
        };
        const clean: FieldErrors = Object.fromEntries(
          Object.entries(errors).filter(([, value]) => value),
        );
        if (Object.keys(clean).length) return { ok: false, errors: clean };

        const normalized = normalizeEmail(email);
        const fails = recentLoginFails(get().loginAttempts, normalized);
        if (fails.length >= 5) {
          return {
            ok: false,
            locked: true,
            errors: { email: "Слишком много попыток, подождите" },
          };
        }

        const user = get().users.find((item) => item.email === normalized);
        const passwordHash = await sha256(password);
        if (!user || !user.passwordHash || user.passwordHash !== passwordHash) {
          set((state) => ({
            loginAttempts: [
              ...state.loginAttempts,
              {
                id: `attempt-${crypto.randomUUID()}`,
                email: normalized,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
          const nextFails = recentLoginFails(get().loginAttempts, normalized);
          if (nextFails.length >= 5) {
            return {
              ok: false,
              locked: true,
              errors: { email: "Слишком много попыток, подождите" },
            };
          }
          return { ok: false, errors: { password: "Неверная почта или пароль" } };
        }

        set((state) => {
          const merged = mergeGuestIntoUser(state, user.id);
          return {
            sessionUserId: user.id,
            loginAttempts: state.loginAttempts.filter((attempt) => attempt.email !== normalized),
            ...merged,
          };
        });
        return { ok: true, errors: {} };
      },
      loginWithGoogle: ({ email, name, image }): AuthResult => {
        const normalized = normalizeEmail(email);
        if (!normalized) return { ok: false, errors: { email: "Нет почты Google" } };

        const existing = get().users.find((user) => user.email === normalized);
        if (existing) {
          set((state) => {
            const merged = mergeGuestIntoUser(state, existing.id);
            return {
              sessionUserId: existing.id,
              users: state.users.map((user) =>
                user.id === existing.id
                  ? {
                      ...user,
                      name: user.name || name,
                      image: image || user.image,
                    }
                  : user,
              ),
              loginAttempts: state.loginAttempts.filter((attempt) => attempt.email !== normalized),
              ...merged,
            };
          });
          return { ok: true, errors: {} };
        }

        const user: User = {
          id: `user-${crypto.randomUUID()}`,
          email: normalized,
          name: name.trim() || normalized.split("@")[0],
          passwordHash: null,
          image,
          role: "customer",
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const merged = mergeGuestIntoUser(state, user.id);
          return {
            users: [...state.users, user],
            sessionUserId: user.id,
            loginAttempts: state.loginAttempts.filter((attempt) => attempt.email !== normalized),
            ...merged,
          };
        });
        return { ok: true, errors: {} };
      },
      logout: () => set({ sessionUserId: null }),
      updateName: (name): AuthResult => {
        const user = currentUser(get());
        if (!user) return { ok: false, errors: { name: "Нужен вход" } };
        const error = validateName(name);
        if (error) return { ok: false, errors: { name: error } };
        set((state) => ({
          users: state.users.map((item) =>
            item.id === user.id ? { ...item, name: name.trim() } : item,
          ),
        }));
        return { ok: true, errors: {} };
      },
      changePassword: async ({ current, password, repeat }): Promise<AuthResult> => {
        const user = currentUser(get());
        if (!user || !user.passwordHash) {
          return { ok: false, errors: { current: "Нужен вход" } };
        }
        const errors: FieldErrors = {
          current: current ? "" : "Укажите текущий пароль",
          password: validatePassword(password),
          repeat: validatePasswordRepeat(password, repeat),
        };
        const clean: FieldErrors = Object.fromEntries(
          Object.entries(errors).filter(([, value]) => value),
        );
        if (Object.keys(clean).length) return { ok: false, errors: clean };

        const currentHash = await sha256(current);
        if (currentHash !== user.passwordHash) {
          return { ok: false, errors: { current: "Неверный текущий пароль" } };
        }
        const passwordHash = await sha256(password);
        set((state) => ({
          users: state.users.map((item) =>
            item.id === user.id ? { ...item, passwordHash } : item,
          ),
        }));
        return { ok: true, errors: {} };
      },
      setPassword: async ({ password, repeat }): Promise<AuthResult> => {
        const user = currentUser(get());
        if (!user) return { ok: false, errors: { password: "Нужен вход" } };
        if (user.passwordHash) {
          return { ok: false, errors: { password: "Пароль уже задан" } };
        }
        const errors: FieldErrors = {
          password: validatePassword(password),
          repeat: validatePasswordRepeat(password, repeat),
        };
        const clean: FieldErrors = Object.fromEntries(
          Object.entries(errors).filter(([, value]) => value),
        );
        if (Object.keys(clean).length) return { ok: false, errors: clean };

        const passwordHash = await sha256(password);
        set((state) => ({
          users: state.users.map((item) =>
            item.id === user.id ? { ...item, passwordHash } : item,
          ),
        }));
        return { ok: true, errors: {} };
      },
      setAvatar: (dataUrl) => {
        const user = currentUser(get());
        if (!user) return;
        set((state) => ({
          users: state.users.map((item) =>
            item.id === user.id ? { ...item, image: dataUrl } : item,
          ),
        }));
      },
      addToCart: (productId, qty) => {
        const product = get().products.find((item) => item.id === productId && item.published);
        if (!product || product.stock <= 0 || qty < 1) return;
        set((state) => {
          const { carts, cartId } = withCart(state, state.sessionUserId);
          const current = state.cartItems.find(
            (item) => item.cartId === cartId && item.productId === productId,
          );
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
          const { carts, cartId } = withCart(state, state.sessionUserId);
          const cartItems = state.cartItems.filter(
            (item) => !(item.cartId === cartId && item.productId === productId),
          );
          if (nextQty > 0) {
            cartItems.push({
              id: `line-${cartId}-${productId}`,
              cartId,
              productId,
              qty: nextQty,
            });
          }
          return { carts, cartItems };
        });
      },
      removeFromCart: (productId) => {
        set((state) => {
          const cart = findCart(state.carts, state.sessionUserId);
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
      toggleFavorite: (productId) => {
        const userId = get().sessionUserId;
        if (!userId) return false;
        const exists = get().favorites.some(
          (item) => item.userId === userId && item.productId === productId,
        );
        if (exists) {
          set((state) => ({
            favorites: state.favorites.filter(
              (item) => !(item.userId === userId && item.productId === productId),
            ),
          }));
          return true;
        }
        set((state) => ({
          favorites: [...state.favorites, { userId, productId }],
        }));
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
        favorites: state.favorites,
        orders: state.orders,
        orderItems: state.orderItems,
        loginAttempts: state.loginAttempts,
        compareIds: state.compareIds,
        guestId: state.guestId,
        sessionUserId: state.sessionUserId,
      }),
    },
  ),
);
