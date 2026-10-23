import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[16px] font-semibold disabled:cursor-not-allowed disabled:opacity-40";

export function controlClass(variant: "primary" | "ghost" = "primary", className = "") {
  const look =
    variant === "primary"
      ? "bg-accent text-inverse"
      : "border border-line bg-transparent text-fg";
  return `${base} ${look} ${className}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return <button className={controlClass(variant, className)} {...props} />;
}

export const inputClass =
  "h-11 w-full rounded-[10px] border border-line bg-elevated px-3 text-[16px] text-fg placeholder:text-fg-soft";

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[13px] text-fg">{error}</span> : null}
    </label>
  );
}
