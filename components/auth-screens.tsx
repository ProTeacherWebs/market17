"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Container } from "@/components/container";
import { GoogleButton } from "@/components/google-button";
import { Button, Field, controlClass, inputClass } from "@/components/ui";
import { safeNext } from "@/lib/auth";
import { currentUser, useShop, type FieldErrors } from "@/lib/store";

function AuthShell({
  title,
  children,
  alt,
}: {
  title: string;
  children: ReactNode;
  alt: ReactNode;
}) {
  return (
    <Container className="py-10">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-[32px] font-bold lg:text-[40px]">{title}</h1>
        <div className="mt-8 space-y-4">{children}</div>
        <p className="mt-6 text-[16px] text-fg-soft">{alt}</p>
      </div>
    </Container>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const login = useShop((state) => state.login);
  const loginWithGoogle = useShop((state) => state.loginWithGoogle);
  const user = currentUser({ users, sessionUserId });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const onGoogle = useCallback(
    (profile: { email: string; name: string; image: string | null }) => {
      const result = loginWithGoogle(profile);
      setErrors(result.errors);
      if (result.ok) router.replace(next);
    },
    [loginWithGoogle, next, router],
  );

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

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

  if (!ready || user) {
    return (
      <Container className="py-10">
        <div className="mx-auto h-10 w-40 rounded-[10px] bg-elevated" />
        <div className="mx-auto mt-6 h-40 max-w-md rounded-[16px] bg-elevated" />
      </Container>
    );
  }

  return (
    <AuthShell
      title="Вход"
      alt={
        <>
          Нет аккаунта?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-fg underline">
            Регистрация
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          void login({ email, password }).then((result) => {
            setPending(false);
            setErrors(result.errors);
            if (result.ok) router.replace(next);
          });
        }}
      >
        <Field label="Почта" error={errors.email}>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Пароль" error={errors.password}>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          Войти
        </Button>
      </form>
      <GoogleButton onSuccess={onGoogle} disabled={pending} />
    </AuthShell>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const ready = useShop((state) => state.ready);
  const failed = useShop((state) => state.failed);
  const users = useShop((state) => state.users);
  const sessionUserId = useShop((state) => state.sessionUserId);
  const register = useShop((state) => state.register);
  const loginWithGoogle = useShop((state) => state.loginWithGoogle);
  const user = currentUser({ users, sessionUserId });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const onGoogle = useCallback(
    (profile: { email: string; name: string; image: string | null }) => {
      const result = loginWithGoogle(profile);
      setErrors(result.errors);
      if (result.ok) router.replace(next);
    },
    [loginWithGoogle, next, router],
  );

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

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

  if (!ready || user) {
    return (
      <Container className="py-10">
        <div className="mx-auto h-10 w-40 rounded-[10px] bg-elevated" />
        <div className="mx-auto mt-6 h-56 max-w-md rounded-[16px] bg-elevated" />
      </Container>
    );
  }

  return (
    <AuthShell
      title="Регистрация"
      alt={
        <>
          Уже есть аккаунт?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-fg underline">
            Войти
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          void register({ name, email, password, repeat }).then((result) => {
            setPending(false);
            setErrors(result.errors);
            if (result.ok) router.replace(next);
          });
        }}
      >
        <Field label="Имя" error={errors.name}>
          <input
            className={inputClass}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Почта" error={errors.email}>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Пароль" error={errors.password}>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Повтор пароля" error={errors.repeat}>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          Создать аккаунт
        </Button>
      </form>
      <GoogleButton onSuccess={onGoogle} disabled={pending} />
    </AuthShell>
  );
}
