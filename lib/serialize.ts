import type {
  Banner as DbBanner,
  Category as DbCategory,
  Order as DbOrder,
  OrderItem as DbOrderItem,
  Product as DbProduct,
  ProductSpec as DbProductSpec,
} from "@prisma/client";
import { toApiBannerSlot } from "@/lib/banners";
import type { Banner, Category, Order, OrderItem, Product, ProductSpec } from "@/lib/types";

export function serializeCategory(row: DbCategory): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    parentId: row.parentId,
    sort: row.sort,
  };
}

export function serializeProduct(row: DbProduct): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    stock: row.stock,
    categoryId: row.categoryId,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    images: row.images,
  };
}

export function serializeSpec(row: DbProductSpec): ProductSpec {
  return {
    id: row.id,
    productId: row.productId,
    group: row.group,
    name: row.name,
    value: row.value,
    sort: row.sort,
  };
}

export function serializeBanner(row: DbBanner): Banner {
  return {
    id: row.id,
    slot: toApiBannerSlot(row.slot),
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
    imageUrl: row.imageUrl,
    enabled: row.enabled,
  };
}

export function serializeOrder(row: DbOrder): Order {
  return {
    id: row.id,
    number: row.number,
    userId: row.userId,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentId: row.paymentId,
    deliveryMethod: row.deliveryMethod,
    phone: row.phone,
    recipientName: row.recipientName,
    addressLine: row.addressLine,
    comment: row.comment,
    itemsTotal: row.itemsTotal,
    deliveryFee: row.deliveryFee,
    total: row.total,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeOrderItem(row: DbOrderItem): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    name: row.name,
    price: row.price,
    qty: row.qty,
  };
}
