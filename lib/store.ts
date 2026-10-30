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
import { deliveryFeeFor } from "@/lib/format";
import { uniqueSlug, wordCount } from "@/lib/slug";
import type {
  Banner,
  BannerSlot,
  Cart,
  CartItem,
  Category,
  DeliveryMethod,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ShopData,
  User,
} from "@/lib/types";

export type FieldErrors = Record<string, string>;

export type AuthResult = {
  ok: boolean;
  errors: FieldErrors;
  locked?: boolean;
};

export type PlaceOrderInput = {
  phone: string;
  recipientName: string;
  deliveryMethod: DeliveryMethod;
  addressLine: string | null;
  comment: string | null;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string; number: string }
  | { ok: false; errors: FieldErrors; stockError?: string };

export type ProductInput = {
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  categoryId: string;
  imageUrl: string;
  published: boolean;
};

export type CategoryInput = {
  name: string;
  slug: string;
  parentId: string | null;
  sort: string;
};

export type BannerInput = {
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string;
  enabled: boolean;
};

export type AdminMutation =
  | { ok: true; id?: string }
  | { ok: false; errors: FieldErrors };

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
  placeOrder: (input: PlaceOrderInput) => PlaceOrderResult;
  markPaymentPending: (orderId: string, paymentId: string) => void;
  markPaymentFailed: (orderId: string) => void;
  applyPaidSession: (input: {
    orderId: string;
    paymentId: string;
    amountKopecks: number;
  }) => { ok: true } | { ok: false; error: string };
  setOrderStatus: (orderId: string, status: OrderStatus) => AdminMutation;
  saveProduct: (input: ProductInput, productId?: string) => AdminMutation;
  removeProduct: (productId: string) => AdminMutation;
  saveCategory: (input: CategoryInput, categoryId?: string) => AdminMutation;
  removeCategory: (categoryId: string) => AdminMutation;
  saveBanner: (slot: BannerSlot, input: BannerInput) => AdminMutation;
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

export function isAdmin(state: Pick<ShopData, "users"> & { sessionUserId: string | null }) {
  return currentUser(state)?.role === "admin";
}

function requireAdmin(get: () => { users: User[]; sessionUserId: string | null }): AdminMutation | null {
  if (!isAdmin(get())) return { ok: false, errors: { form: "Нет доступа" } };
  return null;
}

export function adminStats(state: Pick<ShopData, "orders" | "products" | "users">) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();
  return {
    ordersToday: state.orders.filter((order) => order.createdAt >= startIso).length,
    pendingPayment: state.orders.filter((order) => order.status === "pending_payment").length,
    outOfStock: state.products.filter((product) => product.stock <= 0).length,
    users: state.users.length,
  };
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

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    paymentId: order.paymentId ?? null,
    paymentStatus: order.paymentStatus ?? "unpaid",
  };
}

export function userOrders(state: Pick<ShopData, "orders"> & { sessionUserId: string | null }) {
  if (!state.sessionUserId) return [];
  return state.orders
    .filter((order) => order.userId === state.sessionUserId)
    .map(normalizeOrder)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function orderWithItems(
  state: Pick<ShopData, "orders" | "orderItems">,
  orderId: string,
) {
  const found = state.orders.find((item) => item.id === orderId);
  if (!found) return null;
  const order = normalizeOrder(found);
  return {
    order,
    items: state.orderItems.filter((item) => item.orderId === order.id),
  };
}

function nextOrderNumber(orders: Order[]) {
  let max = 1000;
  for (const order of orders) {
    const match = /^V-(\d+)$/.exec(order.number);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `V-${max + 1}`;
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
            const response = await fetch("/api/v1/bootstrap");
            if (!response.ok) throw new Error("bootstrap");
            const data = (await response.json()) as {
              categories: ShopData["categories"];
              products: ShopData["products"];
              specs: ShopData["specs"];
              banners: ShopData["banners"];
            };
            set({
              categories: data.categories,
              products: data.products,
              specs: data.specs,
              banners: data.banners,
              guestId: get().guestId || crypto.randomUUID(),
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
      placeOrder: (input): PlaceOrderResult => {
        const user = currentUser(get());
        if (!user) return { ok: false, errors: { form: "Нужен вход" } };

        const phone = input.phone.trim();
        const recipientName = input.recipientName.trim();
        const errors: FieldErrors = {};
        if (!phone) errors.phone = "Укажите телефон";
        if (!recipientName) errors.recipientName = "Укажите имя получателя";
        if (input.deliveryMethod === "courier" && !input.addressLine?.trim()) {
          errors.addressLine = "Укажите адрес";
        }
        if (Object.keys(errors).length) return { ok: false, errors };

        const cart = findCart(get().carts, user.id);
        if (!cart) return { ok: false, errors: { form: "Корзина пуста" } };
        const lines = linesFor(cart.id, get().cartItems);
        if (!lines.length) return { ok: false, errors: { form: "Корзина пуста" } };

        const snapshot: { product: Product; qty: number }[] = [];
        for (const line of lines) {
          const product = get().products.find((item) => item.id === line.productId && item.published);
          if (!product) {
            return { ok: false, errors: { form: "Товар больше недоступен" }, stockError: line.productId };
          }
          if (product.stock < line.qty) {
            return {
              ok: false,
              errors: { form: `Не хватает «${product.name}»` },
              stockError: product.id,
            };
          }
          snapshot.push({ product, qty: line.qty });
        }

        const itemsTotal = snapshot.reduce((sum, row) => sum + row.product.price * row.qty, 0);
        const deliveryFee = deliveryFeeFor(itemsTotal, input.deliveryMethod);
        const orderId = `order-${crypto.randomUUID()}`;
        const number = nextOrderNumber(get().orders);
        const order: Order = {
          id: orderId,
          number,
          userId: user.id,
          status: "pending_payment",
          paymentStatus: "unpaid",
          paymentId: null,
          deliveryMethod: input.deliveryMethod,
          phone,
          recipientName,
          addressLine: input.deliveryMethod === "courier" ? input.addressLine!.trim() : null,
          comment: input.comment?.trim() || null,
          itemsTotal,
          deliveryFee,
          total: itemsTotal + deliveryFee,
          createdAt: new Date().toISOString(),
        };
        const orderItems: OrderItem[] = snapshot.map((row) => ({
          id: `oi-${orderId}-${row.product.id}`,
          orderId,
          productId: row.product.id,
          name: row.product.name,
          price: row.product.price,
          qty: row.qty,
        }));

        set((state) => {
          const stockMap = new Map(snapshot.map((row) => [row.product.id, row.qty]));
          return {
            products: state.products.map((product) => {
              const take = stockMap.get(product.id);
              if (!take) return product;
              return { ...product, stock: Math.max(0, product.stock - take) };
            }),
            orders: [...state.orders, order],
            orderItems: [...state.orderItems, ...orderItems],
            cartItems: state.cartItems.filter((item) => item.cartId !== cart.id),
          };
        });

        return { ok: true, orderId, number };
      },
      markPaymentPending: (orderId, paymentId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId && order.paymentStatus !== "paid"
              ? { ...order, paymentStatus: "pending", paymentId }
              : order,
          ),
        }));
      },
      markPaymentFailed: (orderId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId && order.paymentStatus !== "paid"
              ? { ...order, paymentStatus: "failed" }
              : order,
          ),
        }));
      },
      applyPaidSession: ({ orderId, paymentId, amountKopecks }) => {
        const order = get().orders.find((item) => item.id === orderId);
        if (!order) return { ok: false, error: "Заказ не найден" };
        if (order.userId !== get().sessionUserId) return { ok: false, error: "Чужой заказ" };
        if (order.paymentStatus === "paid") return { ok: true };
        if (Math.round(order.total * 100) !== amountKopecks) {
          return { ok: false, error: "Сумма не совпала" };
        }
        set((state) => ({
          orders: state.orders.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  paymentStatus: "paid",
                  paymentId,
                  status: item.status === "pending_payment" ? "confirmed" : item.status,
                }
              : item,
          ),
        }));
        return { ok: true };
      },
      setOrderStatus: (orderId, status) => {
        const denied = requireAdmin(get);
        if (denied) return denied;
        const order = get().orders.find((item) => item.id === orderId);
        if (!order) return { ok: false, errors: { form: "Заказ не найден" } };
        const statuses: OrderStatus[] = [
          "pending_payment",
          "confirmed",
          "shipping",
          "done",
          "cancelled",
        ];
        if (!statuses.includes(status)) {
          return { ok: false, errors: { form: "Неизвестный статус" } };
        }
        if (order.status === status) return { ok: true };

        set((state) => {
          const restore = status === "cancelled" && order.status !== "cancelled";
          const qtyByProduct = new Map<string, number>();
          if (restore) {
            for (const item of state.orderItems.filter((row) => row.orderId === orderId)) {
              qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty);
            }
          }
          return {
            orders: state.orders.map((item) =>
              item.id === orderId ? { ...item, status } : item,
            ),
            products: restore
              ? state.products.map((product) => {
                  const add = qtyByProduct.get(product.id);
                  if (!add) return product;
                  return { ...product, stock: product.stock + add };
                })
              : state.products,
          };
        });
        return { ok: true };
      },
      saveProduct: (input, productId) => {
        const denied = requireAdmin(get);
        if (denied) return denied;

        const name = input.name.trim();
        const brand = input.brand.trim();
        const description = input.description.trim();
        const imageUrl = input.imageUrl.trim();
        const categoryId = input.categoryId.trim();
        const price = Number(input.price);
        const stock = Number(input.stock);
        const compareRaw = input.compareAtPrice.trim();
        const compareAtPrice = compareRaw ? Number(compareRaw) : null;

        const errors: FieldErrors = {};
        if (!name) errors.name = "Укажите название";
        if (!brand) errors.brand = "Укажите бренд";
        if (!description) errors.description = "Укажите описание";
        if (!imageUrl) errors.imageUrl = "Укажите URL фото";
        if (!get().categories.some((item) => item.id === categoryId)) {
          errors.categoryId = "Выберите категорию";
        }
        if (!Number.isFinite(price) || price < 1 || !Number.isInteger(price)) {
          errors.price = "Цена — целое число от 1";
        }
        if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
          errors.stock = "Остаток — целое число от 0";
        }
        if (
          compareRaw &&
          (!Number.isFinite(compareAtPrice!) ||
            compareAtPrice! < 1 ||
            !Number.isInteger(compareAtPrice!) ||
            compareAtPrice! <= price)
        ) {
          errors.compareAtPrice = "Старая цена больше новой";
        }
        if (Object.keys(errors).length) return { ok: false, errors };

        const taken = new Set(get().products.map((item) => item.slug));
        const existing = productId
          ? get().products.find((item) => item.id === productId)
          : undefined;
        if (productId && !existing) return { ok: false, errors: { form: "Товар не найден" } };

        const slugBase = input.slug.trim() || name;
        const slug = uniqueSlug(slugBase, taken, existing?.slug);

        if (existing) {
          set((state) => ({
            products: state.products.map((item) =>
              item.id === existing.id
                ? {
                    ...item,
                    name,
                    slug,
                    brand,
                    description,
                    price,
                    compareAtPrice,
                    stock,
                    categoryId,
                    published: input.published,
                    images: [imageUrl],
                  }
                : item,
            ),
          }));
          return { ok: true, id: existing.id };
        }

        const id = `product-${crypto.randomUUID()}`;
        const product: Product = {
          id,
          slug,
          name,
          brand,
          description,
          price,
          compareAtPrice,
          stock,
          categoryId,
          published: input.published,
          createdAt: new Date().toISOString(),
          images: [imageUrl],
        };
        set((state) => ({ products: [...state.products, product] }));
        return { ok: true, id };
      },
      removeProduct: (productId) => {
        const denied = requireAdmin(get);
        if (denied) return denied;
        const product = get().products.find((item) => item.id === productId);
        if (!product) return { ok: false, errors: { form: "Товар не найден" } };
        const inOrders = get().orderItems.some((item) => item.productId === productId);
        if (inOrders) {
          set((state) => ({
            products: state.products.map((item) =>
              item.id === productId ? { ...item, published: false } : item,
            ),
          }));
          return { ok: true, id: productId };
        }
        set((state) => ({
          products: state.products.filter((item) => item.id !== productId),
          specs: state.specs.filter((item) => item.productId !== productId),
          cartItems: state.cartItems.filter((item) => item.productId !== productId),
          favorites: state.favorites.filter((item) => item.productId !== productId),
          compareIds: state.compareIds.filter((id) => id !== productId),
        }));
        return { ok: true, id: productId };
      },
      saveCategory: (input, categoryId) => {
        const denied = requireAdmin(get);
        if (denied) return denied;
        const name = input.name.trim();
        const parentId = input.parentId;
        const sort = Number(input.sort);
        const errors: FieldErrors = {};
        if (!name) errors.name = "Укажите название";
        if (!Number.isFinite(sort) || !Number.isInteger(sort) || sort < 0) {
          errors.sort = "Порядок — целое число от 0";
        }
        if (parentId && !get().categories.some((item) => item.id === parentId)) {
          errors.parentId = "Родитель не найден";
        }
        if (categoryId && parentId === categoryId) {
          errors.parentId = "Категория не может быть родителем себе";
        }
        if (Object.keys(errors).length) return { ok: false, errors };

        const taken = new Set(get().categories.map((item) => item.slug));
        const existing = categoryId
          ? get().categories.find((item) => item.id === categoryId)
          : undefined;
        if (categoryId && !existing) return { ok: false, errors: { form: "Категория не найдена" } };

        const slug = uniqueSlug(input.slug.trim() || name, taken, existing?.slug);

        if (existing) {
          set((state) => ({
            categories: state.categories.map((item) =>
              item.id === existing.id
                ? { ...item, name, slug, parentId, sort }
                : item,
            ),
          }));
          return { ok: true, id: existing.id };
        }

        const id = `cat-${crypto.randomUUID()}`;
        const category: Category = { id, slug, name, parentId, sort };
        set((state) => ({ categories: [...state.categories, category] }));
        return { ok: true, id };
      },
      removeCategory: (categoryId) => {
        const denied = requireAdmin(get);
        if (denied) return denied;
        const category = get().categories.find((item) => item.id === categoryId);
        if (!category) return { ok: false, errors: { form: "Категория не найдена" } };
        const hasProducts = get().products.some((item) => item.categoryId === categoryId);
        if (hasProducts) {
          return { ok: false, errors: { form: "Сначала уберите товары из категории" } };
        }
        const hasChildren = get().categories.some((item) => item.parentId === categoryId);
        if (hasChildren) {
          return { ok: false, errors: { form: "Сначала удалите подкатегории" } };
        }
        set((state) => ({
          categories: state.categories.filter((item) => item.id !== categoryId),
        }));
        return { ok: true, id: categoryId };
      },
      saveBanner: (slot, input) => {
        const denied = requireAdmin(get);
        if (denied) return denied;
        const title = input.title.trim();
        const subtitle = input.subtitle.trim();
        const href = input.href.trim();
        const imageUrl = input.imageUrl.trim();
        const errors: FieldErrors = {};
        if (!title) errors.title = "Укажите заголовок";
        if (!subtitle) errors.subtitle = "Укажите подзаголовок";
        else if (wordCount(subtitle) > 12) errors.subtitle = "Не больше 12 слов";
        if (!href.startsWith("/") || href.startsWith("//")) {
          errors.href = "Ссылка внутри сайта, например /catalog";
        }
        if (!imageUrl) errors.imageUrl = "Укажите URL картинки";
        if (Object.keys(errors).length) return { ok: false, errors };

        const existing = get().banners.find((item) => item.slot === slot);
        if (!existing) return { ok: false, errors: { form: "Слот не найден" } };

        const next: Banner = {
          ...existing,
          title,
          subtitle,
          href,
          imageUrl,
          enabled: input.enabled,
        };
        set((state) => ({
          banners: state.banners.map((item) => (item.slot === slot ? next : item)),
        }));
        return { ok: true, id: existing.id };
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
