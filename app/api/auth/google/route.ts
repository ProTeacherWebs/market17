import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth";
import { googleClientId, googleClientSecret, googleConfigured } from "@/lib/google";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.json({ enabled: false });
  }
  return NextResponse.json({ enabled: true, clientId: googleClientId() });
}

type Body = {
  code?: string;
};

export async function POST(request: Request) {
  if (!googleConfigured()) {
    return NextResponse.json({ error: "Вход через Google не настроен" }, { status: 501 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Нет кода Google" }, { status: 400 });
  }

  const client = new OAuth2Client(googleClientId(), googleClientSecret(), "postmessage");

  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      return NextResponse.json({ error: "Google не вернул токен" }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId(),
    });
    const payload = ticket.getPayload();
    const email = payload?.email ? normalizeEmail(payload.email) : "";
    if (!email || !payload?.email_verified) {
      return NextResponse.json({ error: "Почта Google не подтверждена" }, { status: 400 });
    }

    return NextResponse.json({
      email,
      name: (payload.name || email.split("@")[0]).slice(0, 80),
      image: payload.picture || null,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        error: "Не удалось проверить вход Google",
        ...(process.env.NODE_ENV === "development" && detail ? { detail } : {}),
      },
      { status: 401 },
    );
  }
}
