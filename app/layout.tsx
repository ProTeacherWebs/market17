import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header, HeaderFallback } from "@/components/header";
import { ShopRoot } from "@/components/shop-root";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: { default: "VOLTA", template: "%s - VOLTA" },
  description: "Интернет-магазин электроники и бытовой техники.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} antialiased`}>
      <body className="flex min-h-[100dvh] flex-col bg-bg font-sans text-fg">
        <ShopRoot>
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </ShopRoot>
      </body>
    </html>
  );
}
