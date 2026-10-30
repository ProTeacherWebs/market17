import type { ApiUser } from "./api";

const TOKEN_KEY = "volta-mini-token";

export function loadToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; token: string; user: ApiUser }
  | { status: "error"; message: string }
  | { status: "preview" };
