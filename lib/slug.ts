const map: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugify(value: string) {
  const raw = value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return raw || "item";
}

export function uniqueSlug(base: string, taken: Set<string>, exclude?: string) {
  let slug = slugify(base);
  if (!taken.has(slug) || slug === exclude) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`) && `${slug}-${n}` !== exclude) n += 1;
  return `${slug}-${n}`;
}

export function wordCount(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
