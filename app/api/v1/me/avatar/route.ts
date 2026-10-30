import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { publicUser, requireUser } from "@/lib/session";

const maxBytes = 2 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Нужен файл", 400);
  if (!allowed.has(file.type)) return jsonError("Только jpg, png или webp", 400);
  if (file.size > maxBytes) return jsonError("Файл больше 2 МБ", 400);

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const dir = path.join(process.cwd(), "public", "avatars", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${user.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  const image = `/avatars/uploads/${filename}?v=${Date.now()}`;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { image },
  });
  return NextResponse.json({ user: publicUser(updated) });
}
