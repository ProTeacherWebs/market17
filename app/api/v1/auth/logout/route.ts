import { NextResponse } from "next/server";
import { signOut } from "@/auth";
import { withApiGuard } from "@/lib/api-guard";

export async function POST(request: Request) {
  const blocked = await withApiGuard(request);
  if (blocked) return blocked;
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
