import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { requireAgent } from "../guard";

export async function generateMetadata() {
  return { title: (await getTranslations("tickets"))("title") };
}

/** Come scp/index.php: apre la lista con la coda personale o quella di sistema. */
export default async function AgentHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAgent(locale);
  redirect({ href: "/agent/tickets", locale });
}
