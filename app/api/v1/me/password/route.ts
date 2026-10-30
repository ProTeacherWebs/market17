import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { validatePassword, validatePasswordRepeat } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  let body: { current?: string; password?: string; repeat?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const password = String(body.password || "");
  const repeat = String(body.repeat || "");
  const errors: Record<string, string> = {
    password: validatePassword(password),
    repeat: validatePasswordRepeat(password, repeat),
  };

  if (user.passwordHash) {
    const current = String(body.current || "");
    if (!current) errors.current = "Укажите текущий пароль";
    else {
      const ok = await bcrypt.compare(current, user.passwordHash);
      if (!ok) errors.current = "Неверный текущий пароль";
    }
  }

  if (Object.values(errors).some(Boolean)) {
    return NextResponse.json({ error: "Проверьте поля", errors }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
