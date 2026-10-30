import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { toDbBannerSlot } from "@/lib/banners";
import { prisma } from "@/lib/db";
import { wordCount } from "@/lib/slug";
import { serializeBanner } from "@/lib/serialize";
import { requireAdmin } from "@/lib/session";
import type { BannerSlot } from "@/lib/types";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);
  const items = await prisma.banner.findMany();
  return NextResponse.json({ items: items.map(serializeBanner) });
}

export async function PATCH(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error || "Нет доступа", 403);

  let body: {
    slot?: string;
    title?: string;
    subtitle?: string;
    href?: string;
    imageUrl?: string;
    enabled?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const slot = body.slot as BannerSlot;
  if (slot !== "hero" && slot !== "side-top" && slot !== "side-bottom") {
    return jsonError("Неизвестный слот", 400);
  }

  const title = String(body.title || "").trim();
  const subtitle = String(body.subtitle || "").trim();
  const href = String(body.href || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const errors: Record<string, string> = {};
  if (!title) errors.title = "Укажите заголовок";
  if (!subtitle) errors.subtitle = "Укажите подзаголовок";
  else if (wordCount(subtitle) > 12) errors.subtitle = "Не больше 12 слов";
  if (!href.startsWith("/") || href.startsWith("//")) {
    errors.href = "Ссылка внутри сайта, например /catalog";
  }
  if (!imageUrl) errors.imageUrl = "Укажите URL картинки";
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Проверьте поля", errors }, { status: 400 });
  }

  const banner = await prisma.banner.update({
    where: { slot: toDbBannerSlot(slot) },
    data: {
      title,
      subtitle,
      href,
      imageUrl,
      enabled: body.enabled !== false,
    },
  });
  return NextResponse.json({ banner: serializeBanner(banner) });
}
