"use client";

import { useMemo, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { slugify } from "@/lib/slug";
import { useShop } from "@/lib/store";
import type { Category } from "@/lib/types";

function CategoryForm({
  category,
  parents,
  onDone,
}: {
  category?: Category;
  parents: Category[];
  onDone: () => void;
}) {
  const saveCategory = useShop((state) => state.saveCategory);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));

  return (
    <form
      className="space-y-4 rounded-[16px] border border-line bg-elevated p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const parentRaw = String(data.get("parentId") || "");
        const result = saveCategory(
          {
            name: String(data.get("name") || ""),
            slug: String(data.get("slug") || ""),
            parentId: parentRaw || null,
            sort: String(data.get("sort") || "0"),
          },
          category?.id,
        );
        if (!result.ok) {
          setErrors(result.errors);
          return;
        }
        setErrors({});
        onDone();
      }}
    >
      <Field label="Название" error={errors.name}>
        <input
          name="name"
          value={name}
          className={inputClass}
          onChange={(event) => {
            const value = event.target.value;
            setName(value);
            if (!slugTouched) setSlug(slugify(value));
          }}
        />
      </Field>
      <Field label="Slug" error={errors.slug}>
        <input
          name="slug"
          value={slug}
          className={inputClass}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
        />
      </Field>
      <Field label="Родитель" error={errors.parentId}>
        <select name="parentId" defaultValue={category?.parentId ?? ""} className={inputClass}>
          <option value="">Без родителя</option>
          {parents
            .filter((item) => item.id !== category?.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Порядок" error={errors.sort}>
        <input
          name="sort"
          inputMode="numeric"
          defaultValue={category?.sort ?? 0}
          className={inputClass}
        />
      </Field>
      {errors.form ? <p className="text-[13px]">{errors.form}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Сохранить</Button>
        {category ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function AdminCategoriesScreen() {
  const categories = useShop((state) => state.categories);
  const products = useShop((state) => state.products);
  const removeCategory = useShop((state) => state.removeCategory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const list = useMemo(
    () => [...categories].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "ru")),
    [categories],
  );
  const nameOf = (id: string | null) =>
    id ? (categories.find((item) => item.id === id)?.name ?? "—") : "—";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold lg:text-[32px]">Категории</h1>
        <Button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
            setError("");
          }}
        >
          Новая категория
        </Button>
      </div>

      {creating ? (
        <div className="mt-6 max-w-xl">
          <CategoryForm
            parents={list}
            onDone={() => {
              setCreating(false);
              setError("");
            }}
          />
        </div>
      ) : null}

      {error ? <p className="mt-4 text-[13px]">{error}</p> : null}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {list.map((category) => {
          const count = products.filter((item) => item.categoryId === category.id).length;
          return (
            <li key={category.id} className="py-4">
              {editingId === category.id ? (
                <div className="max-w-xl">
                  <CategoryForm
                    category={category}
                    parents={list}
                    onDone={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="mt-1 text-[13px] text-fg-soft">
                      {category.slug} · родитель {nameOf(category.parentId)} · товаров {count}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(category.id);
                        setCreating(false);
                        setError("");
                      }}
                    >
                      Править
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const result = removeCategory(category.id);
                        if (!result.ok) {
                          setError(result.errors.form || "Не удалось удалить");
                          return;
                        }
                        setError("");
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
