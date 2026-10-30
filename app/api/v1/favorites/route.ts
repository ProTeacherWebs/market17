import { NextResponse } from "next/server";
import { withApiGuard } from "@/lib/api-guard";
import { jsonError } from "@/lib/api-http";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";
import { requireUser } from "@/lib/session";

export async function GET(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  const { user, error } = await requireUser();
  if (!user) return jsonError(error || "Нужен вход", 401);

  const rows = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
  return NextResponse.json({
    ids: rows.map((row) => row.productId),
    items: rows.filter((row) => row.product.published).map((row) => serializeProduct(row.product)),
  });
}
