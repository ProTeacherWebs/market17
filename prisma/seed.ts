import { PrismaClient, type BannerSlot, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSeed } from "../lib/seed";
import { demoAdminEmail, demoAdminPassword } from "../lib/site";

const prisma = new PrismaClient();

function toBannerSlot(slot: string): BannerSlot {
  if (slot === "side-top") return "side_top";
  if (slot === "side-bottom") return "side_bottom";
  return "hero";
}

async function main() {
  const passwordHash = await bcrypt.hash(demoAdminPassword, 10);
  const seed = createSeed(passwordHash);
  const adminEmail = (process.env.ADMIN_EMAIL || demoAdminEmail).trim().toLowerCase();

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.product.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.category.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  for (const category of seed.categories) {
    await prisma.category.create({
      data: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        parentId: null,
        sort: category.sort,
      },
    });
  }
  for (const category of seed.categories.filter((item) => item.parentId)) {
    await prisma.category.update({
      where: { id: category.id },
      data: { parentId: category.parentId },
    });
  }

  for (const product of seed.products) {
    await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        categoryId: product.categoryId,
        published: product.published,
        createdAt: new Date(product.createdAt),
        images: product.images,
      },
    });
  }

  if (seed.specs.length) {
    await prisma.productSpec.createMany({
      data: seed.specs.map((spec) => ({
        id: spec.id,
        productId: spec.productId,
        group: spec.group,
        name: spec.name,
        value: spec.value,
        sort: spec.sort,
      })),
    });
  }

  for (const banner of seed.banners) {
    await prisma.banner.create({
      data: {
        id: banner.id,
        slot: toBannerSlot(banner.slot),
        title: banner.title,
        subtitle: banner.subtitle,
        href: banner.href,
        imageUrl: banner.imageUrl,
        enabled: banner.enabled,
      },
    });
  }

  await prisma.user.create({
    data: {
      id: "user-admin",
      email: adminEmail,
      name: "Администратор",
      passwordHash,
      role: "admin" satisfies Role,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

  console.log(`Seed OK: ${seed.products.length} товаров, admin ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
