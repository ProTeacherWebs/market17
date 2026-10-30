import { NextResponse } from "next/server";
import { issueAppToken } from "@/lib/app-token";
import { withCors, corsPreflight } from "@/lib/cors";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/session";
import {
  telegramDisplayName,
  telegramEmail,
  validateTelegramInitData,
} from "@/lib/telegram-init-data";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return withCors(request, jsonError("Telegram-бот не настроен", 501));
  }

  let body: { initData?: string };
  try {
    body = await request.json();
  } catch {
    return withCors(request, jsonError("Некорректный запрос", 400));
  }

  const initData = String(body.initData || "");
  const validated = validateTelegramInitData(initData, botToken);
  if (!validated) {
    return withCors(request, jsonError("Неверные данные Telegram", 401));
  }

  const telegramId = BigInt(validated.user.id);
  const email = telegramEmail(telegramId);
  const name = telegramDisplayName(validated.user);
  const image = validated.user.photo_url?.trim() || null;

  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          telegramId,
          name: byEmail.name || name,
          image: byEmail.image || image,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          telegramId,
          passwordHash: null,
          role: "customer",
        },
      });
    }
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name || name,
        image: user.image || image,
      },
    });
  }

  const token = await issueAppToken(user.id);
  return withCors(
    request,
    NextResponse.json({ token, user: publicUser(user) }),
  );
}
