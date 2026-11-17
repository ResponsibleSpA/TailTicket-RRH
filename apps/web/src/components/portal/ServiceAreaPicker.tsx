"use client";

import { useTranslations } from "next-intl";

import FieldShell from "@/components/forms/dynamic/FieldShell";
import { selectCls } from "@/components/forms/dynamic/styles";
import type { PortalArea } from "@/lib/portal-areas";

interface Props {
  areas: PortalArea[];
  value: string;
  onChange: (id: string) => void;
}

export default function ServiceAreaPicker({ areas, value, onChange }: Props) {
  const t = useTranslations("portal.open");
  return (
    <FieldShell htmlFor="serviceArea" label={t("area")} hint={t("areaHint")} required>
      <select id="serviceArea" required value={value} className={selectCls} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t("selectArea")}</option>
        {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
      </select>
    </FieldShell>
  );
}
