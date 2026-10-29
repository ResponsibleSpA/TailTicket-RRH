import { AlarmClock, CircleCheck, Inbox, UserRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import BarBreakdown from "@/components/charts/BarBreakdown";
import ComponentCard from "@/components/common/ComponentCard";
import DataTable from "@/components/common/DataTable";
import EventsChart from "@/components/dashboard/EventsChart";
import KpiCard, { type KpiDelta } from "@/components/dashboard/KpiCard";
import StatsFilter from "@/components/dashboard/StatsFilter";
import StatsTabs from "@/components/dashboard/StatsTabs";
import { agentQueueNav } from "@/server/domain/queue/context";
import {
  PERIOD_CHOICES,
  parseGroup,
  parsePeriod,
  plotData,
  previousRange,
  reportRange,
  seriesTotal,
  tabularData,
  TABULAR_GROUPS,
  type TabularGroup,
  type TabularRow,
} from "@/server/domain/stats/report";
import { agentTimeZone } from "@/server/format/datetime";

import { requireAgent } from "../guard";

export async function generateMetadata() {
  return { title: (await getTranslations("dashboard"))("title") };
}

export default async function AgentDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string; period?: string; group?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const agent = await requireAgent(locale);
  const t = await getTranslations("dashboard");
  const ts = await getTranslations("stats");
  const sp = await searchParams;
  const tz = await agentTimeZone(agent);
  const period = parsePeriod(sp.period);
  const group = parseGroup(sp.group);
  const range = reportRange(sp.start, period, tz);

  // Tutte e tre le schede: servono i conteggi delle righe; la tabella mostra quella attiva
  const [{ top, counts, all }, plot, prevPlot, tables] = await Promise.all([
    agentQueueNav(agent),
    plotData(range, agent),
    plotData(previousRange(range), agent),
    Promise.all(TABULAR_GROUPS.map((g) => tabularData(g, agent, range))),
  ]);
  const rowsOf = Object.fromEntries(TABULAR_GROUPS.map((g, i) => [g, tables[i]])) as Record<TabularGroup, TabularRow[]>;
  const table = rowsOf[group];
  const kpi = (id: number) => (typeof counts.get(id) === "number" ? (counts.get(id) as number) : 0);
  const daily = (name: string) => plot.series.find((x) => x.name === name)?.data ?? [];
  const periodDays = plot.days.length;
  const delta = (name: string, good: KpiDelta["good"]): KpiDelta => ({
    current: seriesTotal(plot, name),
    previous: seriesTotal(prevPlot, name),
    good,
    labels: {
      up: (pct) => t("delta.up", { pct }),
      down: (pct) => t("delta.down", { pct }),
      same: t("delta.same"),
      new: t("delta.new"),
      hint: t("delta.vsPrevious", { days: periodDays }),
    },
  });
  // Ticket per reparto nel periodo: solo i reparti con movimenti, i più attivi in alto
  const deptRows = rowsOf.dept.filter((r) => r.opened + r.closed > 0).sort((a, b) => b.opened + b.closed - (a.opened + a.closed)).slice(0, 8);
  void top;
  const created = delta("created", "neutral");
  const closed = delta("closed", "up");

  // Stessi filtri per schede ed export (l'export rifà la stessa tabularData con questi parametri)
  const filters: Record<string, string> = { start: sp.start ? range.startDay : "", period };
  const query = (extra: Record<string, string>) =>
    new URLSearchParams(Object.entries({ ...extra, ...filters }).filter(([, v]) => v !== "")).toString();
  const hours = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt = (n: number | null) => (n === null ? "—" : hours.format(n));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">{t("welcome", { name: agent.name.first || agent.name.full })}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
        <StatsFilter start={range.startDay} period={period} periods={PERIOD_CHOICES} group={group} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {all.has(1) && (
          <KpiCard
            label={t("kpi.open")}
            value={kpi(1)}
            icon={Inbox}
            href="/agent/tickets?queue=1"
            locale={locale}
            foot={t("kpi.openFoot", { n: created.current })}
            spark={{ data: daily("created"), tone: "primary" }}
          />
        )}
        <KpiCard label={t("kpi.closed")} value={closed.current} icon={CircleCheck} locale={locale} delta={closed} spark={{ data: daily("closed"), tone: "success" }} />
        {all.has(4) && (
          <KpiCard
            label={t("kpi.overdue")}
            value={kpi(4)}
            icon={AlarmClock}
            href="/agent/tickets?queue=4"
            locale={locale}
            danger={kpi(4) > 0}
            foot={kpi(4) > 0 ? t("kpi.overdueFoot") : t("kpi.overdueNone")}
          />
        )}
        {all.has(5) && <KpiCard label={t("kpi.mine")} value={kpi(5)} icon={UserRound} href="/agent/tickets?queue=5" locale={locale} foot={t("kpi.mineFoot")} />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ComponentCard title={t("activity")} desc={t("activityDesc")} className="xl:col-span-2">
          {plot.series.length ? (
            <EventsChart
              days={plot.days}
              series={plot.series.map((s) => ({
                ...s,
                key: s.name,
                name: t.has(`eventNames.${s.name}`) ? t(`eventNames.${s.name}`) : s.name,
              }))}
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noData")}</p>
          )}
        </ComponentCard>
        <ComponentCard title={t("byDept")} desc={t("byDeptDesc")}>
          {deptRows.length ? (
            <BarBreakdown
              categories={deptRows.map((r) => r.label)}
              series={[
                { name: t("cols.opened"), tone: "primary", data: deptRows.map((r) => r.opened) },
                { name: t("cols.closed"), tone: "success", data: deptRows.map((r) => r.closed) },
              ]}
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noData")}</p>
          )}
        </ComponentCard>
      </div>

      <StatsTabs
        active={group}
        tabs={TABULAR_GROUPS.map((g) => ({
          key: g,
          label: t(`groups.${g}`),
          count: rowsOf[g].length,
          countLabel: ts("rows", { count: rowsOf[g].length }),
          href: `/agent?${query({ group: g })}`,
        }))}
        exportHref={`/api/agent/stats/export?${query({ group, locale })}`}
        exportLabel={ts("export")}
        exportTitle={ts("exportTitle", { tab: t(`groups.${group}`) })}
      >
        <DataTable
          empty={t("noData")}
          columns={[
            { key: "label", label: t(`groups.${group}`) },
            { key: "opened", label: t("cols.opened") },
            { key: "assigned", label: t("cols.assigned") },
            { key: "overdue", label: t("cols.overdue") },
            { key: "closed", label: t("cols.closed") },
            { key: "reopened", label: t("cols.reopened") },
            { key: "deleted", label: t("cols.deleted") },
            { key: "service", label: t("cols.serviceTime") },
            { key: "response", label: t("cols.responseTime") },
          ]}
          rows={table.map((r) => ({
            key: r.key,
            cells: {
              label: r.label,
              opened: r.opened,
              assigned: r.assigned,
              overdue: r.overdue,
              closed: r.closed,
              reopened: r.reopened,
              deleted: r.deleted,
              service: fmt(r.serviceTime),
              response: fmt(r.responseTime),
            },
          }))}
        />
      </StatsTabs>
    </div>
  );
}
