"use client";

import { discountPercent } from "@/lib/format";
import type { Banner, Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { useShop } from "@/lib/store";

const promos = [
  {
    href: "/catalog/appliances",
    title: "Крупная техника",
    subtitle: "Artel, Samsung, Gree и LG с витрин Ташкента.",
    image: "/banners/promo-appliances.jpg",
  },
  {
    href: "/catalog/kitchen",
    title: "Кухня и дом",
    subtitle: "Xiaomi, Artel и аэрогрили Dual Zone.",
    image: "/banners/promo-kitchen.jpg",
  },
];

function BannerTile({
  banner,
  large = false,
  className = "",
}: {
  banner: Banner;
  large?: boolean;
  className?: string;
}) {
  return (
    <Link href={banner.href} className={`relative flex overflow-hidden rounded-[16px] ${className}`}>
      <Image
        src={banner.imageUrl}
        alt=""
        fill
        unoptimized
        priority={large}
        sizes={large ? "100vw" : "(min-width: 1024px) 34vw, 100vw"}
        className="object-cover"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-[#0E1014]/90 via-[#0E1014]/35 to-[#0E1014]/10" />
      <span className="relative z-10 mt-auto block p-6">
        {large ? (
          <h1 className="text-[40px] font-bold uppercase leading-none tracking-[-0.03em] lg:text-[56px]">
            {banner.title}
          </h1>
        ) : (
          <p className="text-[28px] font-bold uppercase leading-none tracking-[-0.03em] lg:text-[32px]">
            {banner.title}
          </p>
        )}
        <span className="mt-3 block max-w-[36ch] text-[16px] normal-case leading-normal">{banner.subtitle}</span>
      </span>
    </Link>
  );
}

function BannerGrid({ banners }: { banners: Banner[] }) {
  if (banners.length >= 3) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[240px_240px]">
        <BannerTile banner={banners[0]} large className="min-h-[320px] md:col-span-2 lg:col-span-8 lg:row-span-2 lg:min-h-0" />
        <BannerTile banner={banners[1]} className="min-h-[200px] lg:col-span-4 lg:min-h-0" />
        <BannerTile banner={banners[2]} className="min-h-[200px] lg:col-span-4 lg:min-h-0" />
      </div>
    );
  }
  if (banners.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <BannerTile banner={banners[0]} large className="min-h-[320px] lg:col-span-8" />
        <BannerTile banner={banners[1]} className="min-h-[240px] lg:col-span-4" />
      </div>
    );
  }
  if (banners.length === 1) {
    return <BannerTile banner={banners[0]} large className="min-h-[320px]" />;
  }
  return (
    <h1 className="text-[40px] font-bold tracking-[-0.03em] lg:text-[56px]">VOLTA</h1>
  );
}

function ProductRow({ title, products }: { title: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mt-12">
      <h2 className="text-[32px] font-bold lg:text-[40px]">{title}</h2>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index === 0 && title === "Новинки"} />
        ))}
      </div>
    </section>
  );
}

export function HomeScreen() {
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const banners = useShop((state) => state.banners);
  const products = useShop((state) => state.products);

  if (failed) {
    return (
      <Container className="py-16">
        <h1 className="text-[32px] font-bold">VOLTA</h1>
        <p className="mt-4">Не удалось загрузить. Повторите.</p>
        <button type="button" className="mt-6 underline" onClick={() => window.location.reload()}>
          Повторить
        </button>
      </Container>
    );
  }

  if (!ready) {
    return (
      <Container className="py-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[240px_240px]">
          <div className="min-h-[320px] rounded-[16px] bg-elevated md:col-span-2 lg:col-span-8 lg:row-span-2 lg:min-h-0" />
          <div className="min-h-[200px] rounded-[16px] bg-elevated lg:col-span-4 lg:min-h-0" />
          <div className="min-h-[200px] rounded-[16px] bg-elevated lg:col-span-4 lg:min-h-0" />
        </div>
      </Container>
    );
  }

  const slotOrder = ["hero", "side-top", "side-bottom"];
  const activeBanners = banners
    .filter((banner) => banner.enabled)
    .sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot));

  const published = products.filter((product) => product.published && product.stock > 0);
  const fresh = [...published].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const freshIds = new Set(fresh.map((product) => product.id));
  const hits = [...published]
    .filter((product) => !freshIds.has(product.id))
    .sort(
      (a, b) =>
        discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice) ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 4);

  return (
    <Container className="py-6">
      <Reveal>
        <BannerGrid banners={activeBanners} />
      </Reveal>
      <Reveal index={1}>
        <ProductRow title="Новинки" products={fresh} />
      </Reveal>
      <Reveal index={2} className="mt-12">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {promos.map((promo, index) => (
            <Link
              key={promo.href}
              href={promo.href}
              className={`relative flex min-h-[220px] overflow-hidden rounded-[16px] ${index === 0 ? "lg:col-span-7" : "lg:col-span-5"}`}
            >
              <Image src={promo.image} alt="" fill unoptimized className="object-cover" sizes="(min-width: 1024px) 60vw, 100vw" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0E1014]/90 via-[#0E1014]/30 to-transparent" />
              <span className="relative z-10 mt-auto block p-6">
                <p className="text-[32px] font-bold uppercase leading-none tracking-[-0.03em]">{promo.title}</p>
                <span className="mt-3 block max-w-[36ch] text-[16px] normal-case">{promo.subtitle}</span>
              </span>
            </Link>
          ))}
        </div>
      </Reveal>
      <Reveal index={3}>
        <ProductRow title="Хиты недели" products={hits} />
      </Reveal>
    </Container>
  );
}
