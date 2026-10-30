import { SignJWT, jwtVerify } from "jose";

const ISSUER = "volta-app";
const AUDIENCE = "volta-api";
const TTL = "30d";

function secretKey() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET is required for app tokens");
  return new TextEncoder().encode(secret);
}

export async function issueAppToken(userId: string) {
  return new SignJWT({ typ: "app" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secretKey());
}

export async function verifyAppToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (payload.typ !== "app" || !payload.sub) return null;
    return { sub: String(payload.sub) };
  } catch {
    return null;
  }
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}
