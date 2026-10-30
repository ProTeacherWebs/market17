import { readBearerToken, verifyAppToken } from "@/lib/app-token";
import { jsonError } from "@/lib/api-http";

/** Неверный Bearer → 401. Валидный или отсутствие заголовка → дальше (cookie / публичный). */
export async function withApiGuard(request: Request) {
  const token = readBearerToken(request);
  if (!token) return null;
  const payload = await verifyAppToken(token);
  if (!payload) return jsonError("Неверный токен", 401);
  return null;
}
