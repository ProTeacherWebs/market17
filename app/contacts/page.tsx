import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";
import { supportEmail, supportPhone, supportPhoneHref } from "@/lib/site";

export const metadata: Metadata = { title: "Контакты" };

export default function Page() {
  return (
    <TextPage title="Контакты">
      <p>
        Телефон: <a href={supportPhoneHref}>{supportPhone}</a>
      </p>
      <p>
        Почта: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
    </TextPage>
  );
}
