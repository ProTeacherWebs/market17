import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { serializeBanner } from "@/lib/serialize";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  try {
    const items = await prisma.banner.findMany();
    return NextResponse.json({ items: items.map(serializeBanner) });
  } catch {
    return jsonError("Не удалось загрузить баннеры", 500);
  }
}
