export type Role = "customer" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  image: string | null;
  role: Role;
  createdAt: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  sort: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  published: boolean;
  createdAt: string;
  images: string[];
};

export type ProductSpec = {
  id: string;
  productId: string;
  group: string;
  name: string;
  value: string;
  sort: number;
};

export type BannerSlot = "hero" | "side-top" | "side-bottom";

export type Banner = {
  id: string;
  slot: BannerSlot;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string;
  enabled: boolean;
};

export type Cart = {
  id: string;
  userId: string | null;
};

export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  qty: number;
};

export type Favorite = {
  userId: string;
  productId: string;
};

export type OrderStatus = "pending_payment" | "confirmed" | "shipping" | "done" | "cancelled";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";
export type DeliveryMethod = "courier" | "pickup";

export type Order = {
  id: string;
  number: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId: string | null;
  deliveryMethod: DeliveryMethod;
  phone: string;
  recipientName: string;
  addressLine: string | null;
  comment: string | null;
  itemsTotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type LoginAttempt = {
  id: string;
  email: string;
  createdAt: string;
};

export type ShopData = {
  users: User[];
  categories: Category[];
  products: Product[];
  specs: ProductSpec[];
  banners: Banner[];
  carts: Cart[];
  cartItems: CartItem[];
  favorites: Favorite[];
  orders: Order[];
  orderItems: OrderItem[];
  loginAttempts: LoginAttempt[];
  compareIds: string[];
  guestId: string;
};
