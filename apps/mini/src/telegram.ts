const VOLTA_BG = "#0e1014";
const VOLTA_HEADER = "#0e1014";

/** Поднимает WebApp и красит chrome Telegram в токены VOLTA (не тему клиента). */
export function initTelegramShell(): TelegramWebApp | null {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor(VOLTA_HEADER);
  } catch {
    /* старые клиенты */
  }
  try {
    tg.setBackgroundColor(VOLTA_BG);
  } catch {
    /* старые клиенты */
  }
  const withBottom = tg as TelegramWebApp & {
    setBottomBarColor?: (color: string) => void;
  };
  try {
    withBottom.setBottomBarColor?.(VOLTA_BG);
  } catch {
    /* optional API */
  }

  document.documentElement.style.setProperty("color-scheme", "dark");
  return tg;
}

export type TelegramWebApp = NonNullable<
  NonNullable<Window["Telegram"]>["WebApp"]
>;
