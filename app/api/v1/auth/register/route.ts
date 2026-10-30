import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordRepeat,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/session";
import { demoAdminEmail } from "@/lib/site";

export async function POST(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;

  let body: { name?: string; email?: string; password?: string; repeat?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const name = String(body.name || "");
  const email = normalizeEmail(String(body.email || ""));
  const password = String(body.password || "");
  const repeat = String(body.repeat || "");
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    repeat: validatePasswordRepeat(password, repeat),
  };
  if (Object.values(errors).some(Boolean)) {
    return NextResponse.json({ error: "Проверьте поля", errors }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Почта уже занята", errors: { email: "Почта уже занята" } },
      { status: 409 },
    );
  }

  const adminEmail = (process.env.ADMIN_EMAIL || demoAdminEmail).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: name.trim(),
      passwordHash,
      role: email === adminEmail ? "admin" : "customer",
    },
  });
  await prisma.cart.create({ data: { userId: user.id } });

  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
