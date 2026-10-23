"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccountNav } from "@/components/account-nav";
import { Container } from "@/components/container";
import { Button, Field, controlClass, inputClass } from "@/components/ui";
import {
  avatarSrc,
  currentUser,
  useShop,
  type FieldErrors,
} from "@/lib/store";

const maxBytes = 2 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AccountScreen() {
  const router = useRouter();
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const updateName = useShop((state) => state.updateName);
  const changePassword = useShop((state) => state.changePassword);
  const setPassword = useShop((state) => state.setPassword);
  const setAvatar = useShop((state) => state.setAvatar);
  const logout = useShop((state) => state.logout);
  const user = useMemo(() => currentUser({ users, sessionUserId }), [users, sessionUserId]);

  const [name, setName] = useState("");
  const [nameSourceId, setNameSourceId] = useState<string | null>(null);
  const [nameErrors, setNameErrors] = useState<FieldErrors>({});
  const [nameOk, setNameOk] = useState("");
  const [current, setCurrent] = useState("");
  const [password, setPasswordValue] = useState("");
  const [repeat, setRepeat] = useState("");
  const [passErrors, setPassErrors] = useState<FieldErrors>({});
  const [passOk, setPassOk] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (user && user.id !== nameSourceId) {
    setNameSourceId(user.id);
    setName(user.name);
  }

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  if (failed) {
    return (
      <Container className="py-16">
        <p>Не удалось загрузить. Повторите.</p>
        <button type="button" className={`${controlClass()} mt-6`} onClick={() => window.location.reload()}>
          Повторить
        </button>
      </Container>
    );
  }

  if (!ready || !user) {
    return (
      <Container className="py-8">
        <div className="h-10 w-48 rounded-[10px] bg-elevated" />
        <div className="mt-6 h-40 rounded-[16px] bg-elevated" />
      </Container>
    );
  }

  const photo = avatarSrc(user);
  const googleOnly = !user.passwordHash;

  return (
    <Container className="py-8">
      <h1 className="text-[32px] font-bold lg:text-[40px]">Кабинет</h1>
      <div className="mt-6">
        <AccountNav />
      </div>

      <section className="mt-8 max-w-xl">
        <h2 className="text-[20px] font-semibold">Профиль</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-elevated">
            <Image src={photo} alt="" fill unoptimized className="object-cover" sizes="96px" />
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (!allowed.has(file.type)) {
                  setAvatarError("Нужен файл jpg, png или webp");
                  return;
                }
                if (file.size > maxBytes) {
                  setAvatarError("Файл больше 2 МБ");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result !== "string" || !reader.result.startsWith("data:image/")) {
                    setAvatarError("Не удалось прочитать файл");
                    return;
                  }
                  setAvatarError("");
                  setAvatar(reader.result);
                };
                reader.onerror = () => setAvatarError("Не удалось прочитать файл");
                reader.readAsDataURL(file);
              }}
            />
            <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()}>
              Сменить фото
            </Button>
            {avatarError ? <p className="mt-2 text-[13px]">{avatarError}</p> : null}
          </div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const result = updateName(name);
            setNameErrors(result.errors);
            setNameOk(result.ok ? "Имя сохранено" : "");
          }}
        >
          <Field label="Имя" error={nameErrors.name}>
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Почта">
            <input className={inputClass} value={user.email} disabled readOnly />
          </Field>
          <Button type="submit">Сохранить имя</Button>
          {nameOk ? <p className="text-[13px] text-fg-soft">{nameOk}</p> : null}
        </form>
      </section>

      <section className="mt-12 max-w-xl">
        <h2 className="text-[20px] font-semibold">{googleOnly ? "Задать пароль" : "Сменить пароль"}</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              const result = googleOnly
                ? await setPassword({ password, repeat })
                : await changePassword({ current, password, repeat });
              setPassErrors(result.errors);
              setPassOk(result.ok ? (googleOnly ? "Пароль задан" : "Пароль изменён") : "");
              if (result.ok) {
                setCurrent("");
                setPasswordValue("");
                setRepeat("");
              }
            })();
          }}
        >
          {googleOnly ? null : (
            <Field label="Текущий пароль" error={passErrors.current}>
              <input
                className={inputClass}
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </Field>
          )}
          <Field label="Новый пароль" error={passErrors.password}>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPasswordValue(event.target.value)}
            />
          </Field>
          <Field label="Повтор пароля" error={passErrors.repeat}>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            />
          </Field>
          <Button type="submit">{googleOnly ? "Задать пароль" : "Сменить пароль"}</Button>
          {passOk ? <p className="text-[13px] text-fg-soft">{passOk}</p> : null}
        </form>
      </section>

      <div className="mt-12">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Выйти
        </Button>
      </div>
    </Container>
  );
}
