import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { normalizeEmail, recentLoginFails, validateEmail } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/session";

export async function POST(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const email = normalizeEmail(String(body.email || ""));
  const password = String(body.password || "");
  const emailError = validateEmail(email);
  if (emailError || !password) {
    return NextResponse.json(
      {
        error: "Проверьте поля",
        errors: {
          email: emailError,
          password: password ? "" : "Укажите пароль",
        },
      },
      { status: 400 },
    );
  }

  const since = new Date(Date.now() - 15 * 60 * 1000);
  const attempts = await prisma.loginAttempt.findMany({
    where: { email, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  const fails = recentLoginFails(
    attempts.map((item) => ({ email: item.email, createdAt: item.createdAt.toISOString() })),
    email,
  );
  if (fails.length >= 5) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите 15 минут", locked: true },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!ok || !user) {
    await prisma.loginAttempt.create({ data: { email } });
    return NextResponse.json(
      { error: "Неверная почта или пароль", errors: { form: "Неверная почта или пароль" } },
      { status: 401 },
    );
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError("Неверная почта или пароль", 401);
    }
    throw error;
  }

  return NextResponse.json({ user: publicUser(user) });
}
