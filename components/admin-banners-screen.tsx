"use client";

import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { useShop } from "@/lib/store";
import type { Banner, BannerSlot } from "@/lib/types";

const slotLabel: Record<BannerSlot, string> = {
  hero: "Большой баннер",
  "side-top": "Правый верхний",
  "side-bottom": "Правый нижний",
};

const slotOrder: BannerSlot[] = ["hero", "side-top", "side-bottom"];

function BannerForm({ banner }: { banner: Banner }) {
  const saveBanner = useShop((state) => state.saveBanner);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-4 rounded-[16px] border border-line bg-elevated p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = saveBanner(banner.slot, {
          title: String(data.get("title") || ""),
          subtitle: String(data.get("subtitle") || ""),
          href: String(data.get("href") || ""),
          imageUrl: String(data.get("imageUrl") || ""),
          enabled: data.get("enabled") === "on",
        });
        if (!result.ok) {
          setErrors(result.errors);
          setMessage("");
          return;
        }
        setErrors({});
        setMessage("Сохранено");
      }}
    >
      <h2 className="text-[18px] font-bold">{slotLabel[banner.slot]}</h2>
      <Field label="Заголовок" error={errors.title}>
        <input name="title" defaultValue={banner.title} className={inputClass} />
      </Field>
      <Field label="Подзаголовок (до 12 слов)" error={errors.subtitle}>
        <input name="subtitle" defaultValue={banner.subtitle} className={inputClass} />
      </Field>
      <Field label="Ссылка" error={errors.href}>
        <input name="href" defaultValue={banner.href} className={inputClass} placeholder="/catalog" />
      </Field>
      <Field label="URL картинки" error={errors.imageUrl}>
        <input name="imageUrl" defaultValue={banner.imageUrl} className={inputClass} />
      </Field>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={banner.enabled}
          className="h-5 w-5"
        />
        <span>Включён</span>
      </label>
      {errors.form ? <p className="text-[13px]">{errors.form}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Сохранить</Button>
        {message ? <span className="text-[13px] text-fg-soft">{message}</span> : null}
      </div>
    </form>
  );
}

export function AdminBannersScreen() {
  const banners = useShop((state) => state.banners);
  const ordered = slotOrder
    .map((slot) => banners.find((item) => item.slot === slot))
    .filter((item): item is Banner => Boolean(item));

  return (
    <div>
      <h1 className="text-[28px] font-bold lg:text-[32px]">Баннеры</h1>
      <p className="mt-2 text-[13px] text-fg-soft">
        Выключенный слот не оставляет дырку на главной.
      </p>
      <div className="mt-6 grid max-w-2xl gap-4">
        {ordered.map((banner) => (
          <BannerForm key={`${banner.id}-${banner.enabled}-${banner.title}`} banner={banner} />
        ))}
      </div>
    </div>
  );
}
