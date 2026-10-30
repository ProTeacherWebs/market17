const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  createdAt: string;
};

function url(path: string) {
  return `${API_BASE}${path}`;
}

export async function apiJson<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(url(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }
  return data;
}

export function telegramLogin(initData: string) {
  return apiJson<{ token: string; user: ApiUser }>("/api/v1/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData }),
  });
}

export function fetchMe(token: string) {
  return apiJson<{ user: ApiUser }>("/api/v1/me", { token });
}
