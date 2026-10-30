import { NextResponse } from "next/server";

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export function absoluteUrl(request: Request, path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    (() => {
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      if (!host) return "http://localhost:3000";
      const proto = request.headers.get("x-forwarded-proto") || "http";
      return `${proto}://${host}`;
    })();
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}
