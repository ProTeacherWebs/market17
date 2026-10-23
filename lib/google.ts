export function googleConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim());
}

export function googleClientId() {
  return process.env.AUTH_GOOGLE_ID?.trim() || "";
}

export function googleClientSecret() {
  return process.env.AUTH_GOOGLE_SECRET?.trim() || "";
}
