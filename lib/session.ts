import { auth } from "@/auth";
import { readBearerToken, verifyAppToken } from "@/lib/app-token";
import { prisma } from "@/lib/db";
import type { Role, User } from "@prisma/client";
import { headers } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
};

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
  };
}

async function userFromBearerHeader(): Promise<SessionUser | null> {
  const h = await headers();
  const authHeader = h.get("authorization");
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const token = match?.[1]?.trim();
  if (!token) return null;
  const payload = await verifyAppToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;
  return toSessionUser(user);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const fromBearer = await userFromBearerHeader();
  if (fromBearer) return fromBearer;

  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  return toSessionUser(user);
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { user: null as User | null, error: "Нужен вход" as const };
  const full = await prisma.user.findUnique({ where: { id: user.id } });
  return { user: full, error: null };
}

export async function requireAdmin() {
  const { user, error } = await requireUser();
  if (error || !user) return { user: null, error: error || "Нужен вход" };
  if (user.role !== "admin") return { user: null, error: "Нет доступа" };
  return { user, error: null };
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Проверка Bearer без cookie (для тестов / явного request). */
export async function getUserFromRequest(request: Request): Promise<SessionUser | null> {
  const token = readBearerToken(request);
  if (token) {
    const payload = await verifyAppToken(token);
    if (!payload) return null;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return toSessionUser(user);
  }
  return getSessionUser();
}
