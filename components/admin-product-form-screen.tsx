"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Field, controlClass, inputClass } from "@/components/ui";
import { slugify } from "@/lib/slug";
import { useShop } from "@/lib/store";

export function AdminProductFormScreen({ productId }: { productId?: string }) {
  const router = useRouter();
  const products = useShop((state) => state.products);
  const categories = useShop((state) => state.categories);
  const saveProduct = useShop((state) => state.saveProduct);
  const removeProduct = useShop((state) => state.removeProduct);
  const product = useMemo(
    () => (productId ? products.find((item) => item.id === productId) : undefined),
    [products, productId],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [message, setMessage] = useState("");

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "ru")),
    [categories],
  );

  if (productId && !product) {
    return (
      <div>
        <h1 className="text-[28px] font-bold">Товар не найден</h1>
        <Link href="/admin/products" className={`${controlClass()} mt-6`}>
          К списку
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold lg:text-[32px]">
        {product ? "Правка товара" : "Новый товар"}
      </h1>
      <form
        key={`product-form-${product?.id ?? "new"}-${product?.published ?? true}`}
        className="mt-8 max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const result = saveProduct(
            {
              name: String(data.get("name") || ""),
              slug: String(data.get("slug") || ""),
              brand: String(data.get("brand") || ""),
              description: String(data.get("description") || ""),
              price: String(data.get("price") || ""),
              compareAtPrice: String(data.get("compareAtPrice") || ""),
              stock: String(data.get("stock") || ""),
              categoryId: String(data.get("categoryId") || ""),
              imageUrl: String(data.get("imageUrl") || ""),
              published: data.get("published") === "on",
            },
            product?.id,
          );
          if (!result.ok) {
            setErrors(result.errors);
            setMessage("");
            return;
          }
          setErrors({});
          setMessage("Сохранено");
          if (!product && result.id) router.replace(`/admin/products/${result.id}`);
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
        <Field label="Бренд" error={errors.brand}>
          <input name="brand" defaultValue={product?.brand ?? ""} className={inputClass} />
        </Field>
        <Field label="Описание" error={errors.description}>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            className={`${inputClass} h-auto py-3`}
          />
        </Field>
        <Field label="Цена, ₽" error={errors.price}>
          <input
            name="price"
            inputMode="numeric"
            defaultValue={product?.price ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Старая цена, ₽" error={errors.compareAtPrice}>
          <input
            name="compareAtPrice"
            inputMode="numeric"
            defaultValue={product?.compareAtPrice ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Остаток" error={errors.stock}>
          <input
            name="stock"
            inputMode="numeric"
            defaultValue={product?.stock ?? 0}
            className={inputClass}
          />
        </Field>
        <Field label="Категория" error={errors.categoryId}>
          <select
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
            className={inputClass}
          >
            <option value="">Выберите</option>
            {sortedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="URL фото" error={errors.imageUrl}>
          <input
            name="imageUrl"
            defaultValue={product?.images[0] ?? ""}
            className={inputClass}
            placeholder="/products/example.jpg"
          />
        </Field>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={product?.published ?? true}
            className="h-5 w-5"
          />
          <span className="text-[16px]">Показывать на сайте</span>
        </label>
        {errors.form ? <p className="text-[13px] text-fg">{errors.form}</p> : null}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit">Сохранить</Button>
          <Link href="/admin/products" className={controlClass("ghost")}>
            К списку
          </Link>
          {message ? <span className="text-[13px] text-fg-soft">{message}</span> : null}
        </div>
      </form>

      {product ? (
        <div className="mt-10 border-t border-line pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const result = removeProduct(product.id);
              if (!result.ok) {
                setErrors(result.errors);
                return;
              }
              const still = useShop.getState().products.some((item) => item.id === product.id);
              if (!still) {
                router.replace("/admin/products");
                return;
              }
              setMessage("Снят с витрины");
            }}
          >
            Удалить или скрыть
          </Button>
          <p className="mt-2 text-[13px] text-fg-soft">
            Если товар уже в заказах — только скрывается с витрины.
          </p>
        </div>
      ) : null}
    </div>
  );
}
