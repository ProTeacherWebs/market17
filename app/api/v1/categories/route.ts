import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { serializeCategory } from "@/lib/serialize";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  try {
    const items = await prisma.category.findMany({ orderBy: [{ sort: "asc" }, { name: "asc" }] });
    return NextResponse.json({ items: items.map(serializeCategory) });
  } catch {
    return jsonError("Не удалось загрузить категории", 500);
  }
}
