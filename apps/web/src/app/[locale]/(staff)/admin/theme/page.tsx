import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import { loadTheme } from "@/server/theme/theme";

import { requireAdmin } from "../guard";
import ThemeEditor from "./ThemeEditor";
import { adminMetadata } from "../metadata";

export const generateMetadata = adminMetadata("theme");

export default async function AdminThemePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("admin.theme");
  const theme = await loadTheme();
  const { displayName, staffLogoId, clientLogoId, backdropId, ...settings } = theme;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("desc")} />
      <ThemeEditor
        initial={settings}
        helpdeskTitle={displayName}
        hasStaffLogo={staffLogoId > 0}
        hasClientLogo={clientLogoId > 0}
        hasBackdrop={backdropId > 0}
        legacyLogoUrl={process.env.OST_PHP_URL ? `${process.env.OST_PHP_URL}/scp/settings.php?t=pages` : undefined}
      />
    </div>
  );
}
