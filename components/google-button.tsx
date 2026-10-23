"use client";

import { useEffect, useRef, useState } from "react";
import { controlClass } from "@/components/ui";

type Config = { enabled: false } | { enabled: true; clientId: string };

type GoogleProfile = {
  email: string;
  name: string;
  image: string | null;
};

let scriptPromise: Promise<void> | null = null;

function loadGis() {
  if (typeof window === "undefined") return Promise.reject(new Error("window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-volta-gis="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("gis")));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.dataset.voltaGis = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("gis"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function GoogleButton({
  onSuccess,
  disabled = false,
}: {
  onSuccess: (profile: GoogleProfile) => void;
  disabled?: boolean;
}) {
  const [config, setConfig] = useState<Config | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const clientRef = useRef<{ requestCode: () => void } | null>(null);

  useEffect(() => {
    let cancel = false;
    void fetch("/api/auth/google")
      .then((response) => response.json())
      .then((data: Config) => {
        if (!cancel) setConfig(data);
      })
      .catch(() => {
        if (!cancel) setConfig({ enabled: false });
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!config || !config.enabled) {
      clientRef.current = null;
      return;
    }
    let cancel = false;
    void loadGis()
      .then(() => {
        if (cancel || !window.google?.accounts.oauth2) return;
        clientRef.current = window.google.accounts.oauth2.initCodeClient({
          client_id: config.clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: (response) => {
            setPending(true);
            setNote("");
            void fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: response.code }),
            })
              .then(async (res) => {
                const data = (await res.json()) as GoogleProfile & { error?: string };
                if (!res.ok) throw new Error(data.error || "Ошибка Google");
                onSuccess({ email: data.email, name: data.name, image: data.image });
              })
              .catch((error: unknown) => {
                setNote(error instanceof Error ? error.message : "Не удалось войти через Google");
              })
              .finally(() => setPending(false));
          },
          error_callback: () => {
            setPending(false);
            setNote("Вход через Google отменён");
          },
        });
      })
      .catch(() => {
        if (!cancel) setNote("Не удалось загрузить Google");
      });
    return () => {
      cancel = true;
    };
  }, [config, onSuccess]);

  return (
    <div>
      <button
        type="button"
        className={`${controlClass("ghost")} w-full`}
        disabled={disabled || pending || config === null}
        onClick={() => {
          if (!config?.enabled) {
            setNote("Вход через Google не настроен");
            return;
          }
          if (!clientRef.current) {
            setNote("Google ещё загружается");
            return;
          }
          setNote("");
          setPending(true);
          clientRef.current.requestCode();
        }}
      >
        Войти через Google
      </button>
      {note ? <p className="mt-2 text-[13px] text-fg-soft">{note}</p> : null}
    </div>
  );
}
