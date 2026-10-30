import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { validateName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionUser, publicUser, requireUser } from "@/lib/session";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return jsonError("Нужен вход", 401);
  const full = await prisma.user.findUnique({ where: { id: user.id } });
  if (!full) return jsonError("Нужен вход", 401);
  return NextResponse.json({ user: publicUser(full) });
}

export async function PATCH(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный запрос", 400);
  }

  const nameError = validateName(String(body.name || ""));
  if (nameError) {
    return NextResponse.json({ error: nameError, errors: { name: nameError } }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: String(body.name).trim() },
  });
  return NextResponse.json({ user: publicUser(updated) });
}
