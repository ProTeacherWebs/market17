import { discountLabel, discountPercent, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  return (
    <Link href={`/product/${product.slug}`} className="block">
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-elevated">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        {discount > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-[13px] font-semibold text-white">
            {discountLabel(discount)}
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 line-clamp-2 text-[16px] font-semibold leading-snug">{product.name}</h2>
      <p className="mt-1 text-[18px] font-bold">{formatPrice(product.price)}</p>
      {discount > 0 && product.compareAtPrice ? (
        <p className="text-[13px] font-medium text-fg-soft line-through">{formatPrice(product.compareAtPrice)}</p>
      ) : null}
      {product.stock === 0 ? <p className="mt-1 text-[13px] font-medium text-fg-soft">Нет в наличии</p> : null}
    </Link>
  );
}
