export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function safeNext(value: string | null | undefined) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function validateName(name: string) {
  const value = name.trim();
  if (!value) return "Укажите имя";
  if (value.length < 2) return "Имя слишком короткое";
  if (value.length > 80) return "Имя слишком длинное";
  return "";
}

export function validateEmail(email: string) {
  const value = normalizeEmail(email);
  if (!value) return "Укажите почту";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Некорректная почта";
  return "";
}

export function validatePassword(password: string) {
  if (!password) return "Укажите пароль";
  if (password.length < 8) return "Не меньше 8 символов";
  if (!/[A-Za-zА-Яа-яЁё]/.test(password)) return "Нужна хотя бы одна буква";
  if (!/\d/.test(password)) return "Нужна хотя бы одна цифра";
  return "";
}

export function validatePasswordRepeat(password: string, repeat: string) {
  if (!repeat) return "Повторите пароль";
  if (repeat !== password) return "Пароли не совпадают";
  return "";
}

const windowMs = 15 * 60 * 1000;

export function recentLoginFails(
  attempts: { email: string; createdAt: string }[],
  email: string,
  now = Date.now(),
) {
  const normalized = normalizeEmail(email);
  return attempts.filter(
    (attempt) =>
      attempt.email === normalized && now - Date.parse(attempt.createdAt) <= windowMs,
  );
}
