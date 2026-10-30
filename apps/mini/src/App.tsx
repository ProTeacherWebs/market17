import { House, MagnifyingGlass, ShoppingCart, User } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { fetchMe, telegramLogin } from "./api";
import { loadToken, saveToken, type AuthState } from "./session";
import { initTelegramShell, type TelegramWebApp } from "./telegram";

const NAV = [
  { id: "home", label: "Главная", Icon: House },
  { id: "search", label: "Поиск", Icon: MagnifyingGlass },
  { id: "cart", label: "Корзина", Icon: ShoppingCart },
  { id: "account", label: "Кабинет", Icon: User },
] as const;

export default function App() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [tab, setTab] = useState<(typeof NAV)[number]["id"]>("home");
  const [auth, setAuth] = useState<AuthState>({ status: "idle" });

  useEffect(() => {
    const webApp = initTelegramShell();
    setTg(webApp);

    let cancelled = false;

    async function boot() {
      if (!webApp?.initData) {
        if (!cancelled) setAuth({ status: "preview" });
        return;
      }

      if (!cancelled) setAuth({ status: "loading" });

      try {
        const existing = loadToken();
        if (existing) {
          const { user } = await fetchMe(existing);
          if (!cancelled) {
            setAuth({ status: "ready", token: existing, user });
            return;
          }
        }

        const { token, user } = await telegramLogin(webApp.initData);
        saveToken(token);
        if (!cancelled) setAuth({ status: "ready", token, user });
      } catch (error) {
        if (!cancelled) {
          setAuth({
            status: "error",
            message: error instanceof Error ? error.message : "Не удалось войти",
          });
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const hint =
    auth.status === "ready"
      ? auth.user.name
      : auth.status === "loading"
        ? "Вход…"
        : auth.status === "error"
          ? "Ошибка входа"
          : auth.status === "preview"
            ? "Превью вне Telegram"
            : tg?.initDataUnsafe.user?.first_name || "Telegram";

  return (
    <div className="shell">
      <header className="top">
        <p className="brand">VOLTA</p>
        <p className="hint">{hint}</p>
      </header>

      <main className="main">
        <h1 className="title">Магазин в Telegram</h1>
        {auth.status === "ready" ? (
          <p className="lead">
            Вход через Telegram подтверждён. Сессия для API выдана. Витрина — задача M03.
          </p>
        ) : auth.status === "loading" ? (
          <p className="lead">Проверяем данные Telegram…</p>
        ) : auth.status === "error" ? (
          <p className="lead error">{auth.message}</p>
        ) : (
          <p className="lead">
            Вне Telegram вход недоступен: нужен настоящий initData. Откройте Mini App из бота.
          </p>
        )}

        <div className="panel">
          <p className="panel-label">Сейчас</p>
          <p className="panel-value">
            {auth.status === "ready" && tab === "account"
              ? `${auth.user.name} · покупатель`
              : tab === "home"
                ? "Главная (заглушка)"
                : tab === "search"
                  ? "Поиск (заглушка)"
                  : tab === "cart"
                    ? "Корзина (заглушка)"
                    : "Кабинет (заглушка)"}
          </p>
          {auth.status === "ready" ? (
            <p className="panel-meta">role: {auth.user.role}</p>
          ) : null}
        </div>
      </main>

      <nav className="nav" aria-label="Разделы">
        {NAV.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              className={`nav-item press${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={22} weight={active ? "fill" : "regular"} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <style>{css}</style>
    </div>
  );
}

const css = `
.shell {
  display: flex;
  flex-direction: column;
  min-height: var(--tg-viewport-stable-height, 100dvh);
  padding-top: var(--safe-top);
  background: var(--bg);
  color: var(--text);
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 8px;
}

.brand {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-soft);
}

.main {
  flex: 1;
  padding: 8px 16px 24px;
}

.title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

.lead {
  margin: 0 0 20px;
  max-width: 36rem;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-soft);
}

.lead.error {
  color: var(--sale);
}

.panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--bg-elevated);
  padding: 16px;
}

.panel-label {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--text-soft);
}

.panel-value {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.panel-meta {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-soft);
}

.nav {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: auto;
  padding: 8px 8px calc(8px + var(--safe-bottom));
  border-top: 1px solid var(--line);
  background: var(--bg-elevated);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  padding: 8px 4px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-soft);
  cursor: pointer;
}

.nav-item span {
  font-size: 11px;
  line-height: 1.2;
}

.nav-item.is-active {
  color: var(--text);
}
`;
