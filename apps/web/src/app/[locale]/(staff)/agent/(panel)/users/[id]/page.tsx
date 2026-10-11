import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import ComponentCard from "@/components/common/ComponentCard";
import { Forbidden, PageHeader } from "@/components/common/DataTable";
import InfoRow from "@/components/common/InfoRow";
import { WriteGate } from "@/components/common/WriteGate";
import AccountStatusBadge from "@/components/people/AccountStatusBadge";
import PeopleDoneNotice from "@/components/people/PeopleDoneNotice";
import { ActionLink } from "@/components/people/PeopleLinks";
import UserActions from "@/components/people/directory/UserActions";
import PersonTickets, { type TicketStateFilter } from "@/components/people/PersonTickets";
import { Link } from "@/i18n/navigation";
import { idOrNotFound } from "@/lib/route-id";
import { db } from "@/server/db";
import { loadUser } from "@/server/domain/directory/directory";
import { editFormFields } from "@/server/domain/directory/ui";
import { GlobalPerm, TicketPerm } from "@/server/domain/staff/staff";
import { agentTimeZone, formatDbDate } from "@/server/format/datetime";

import { requireAgent } from "../../../guard";

export async function generateMetadata() {
  return { title: (await getTranslations("directory"))("users") };
}

export default async function UserPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ tickets?: string; done?: string }> }) {
  const { locale, id } = await params;
  const { tickets, done } = await searchParams;
  const filter: TicketStateFilter = tickets === "open" || tickets === "closed" ? tickets : "all";
  setRequestLocale(locale);
  const agent = await requireAgent(locale);
  const t = await getTranslations("directory");
  if (!agent.hasGlobalPerm(GlobalPerm.USER_DIR)) return <Forbidden message={t("noAccess")} />;
  const user = await loadUser(idOrNotFound(id));
  if (!user) notFound();
  const tz = await agentTimeZone(agent);
  // UserAccount: status con i bit di UserAccountStatus (confermato, bloccato…)
  const [fields, acct, orgs] = await Promise.all([
    editFormFields("U", user.id, { name: user.name, email: user.email ?? "" }),
    db().selectFrom("user_account").select(["status", "username", "timezone"]).where("user_id", "=", user.id).executeTakeFirst(),
    db().selectFrom("organization").select(["id", "name"]).orderBy("name").execute(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        subtitle={user.email}
        actions={
          <div className="flex flex-wrap gap-2">
            {/* tickets.php?a=open&uid=: nuovo ticket con l'utente già selezionato */}
            {agent.hasPermInAnyRole(TicketPerm.CREATE) && (
              <WriteGate>
                <ActionLink href={`/agent/tickets/new?uid=${user.id}`}>{t("newTicketForUser")}</ActionLink>
              </WriteGate>
            )}
            <ActionLink href={`/agent/tickets?user=${user.id}`} primary>
              <span className="tabular-nums">{t("viewTickets", { n: user.tickets })}</span>
            </ActionLink>
          </div>
        }
      />
      <PeopleDoneNotice done={done} name={user.name} />
      <UserActions
        data={{
          userId: user.id,
          name: user.name,
          orgId: user.org_id,
          orgName: user.org_name,
          tickets: user.tickets,
          fields,
          account: acct ? { status: acct.status, username: acct.username ?? "", timezone: acct.timezone ?? "" } : null,
          orgs,
          timezones: Intl.supportedValuesOf("timeZone"),
          can: {
            edit: agent.hasGlobalPerm(GlobalPerm.USER_EDIT),
            delete: agent.hasGlobalPerm(GlobalPerm.USER_DELETE),
            manage: agent.hasGlobalPerm(GlobalPerm.USER_MANAGE),
            createOrg: agent.hasGlobalPerm(GlobalPerm.ORG_CREATE),
          },
        }}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title={t("profile")}>
          <dl>
            <InfoRow label={t("emails")} value={user.emails.join(", ")} />
            <InfoRow
              label={t("organization")}
              value={
                user.org_id ? (
                  <Link href={`/agent/orgs/${user.org_id}`} className="text-brand-600 hover:underline dark:text-brand-400">
                    {user.org_name}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow label={t("account")} value={<AccountStatusBadge status={user.account_status} />} />
            {user.username && <InfoRow label={t("username")} value={user.username} />}
            <InfoRow label={t("created")} value={formatDbDate(user.created, tz, locale)} />
            <InfoRow label={t("updated")} value={formatDbDate(user.updated, tz, locale)} />
          </dl>
        </ComponentCard>
        <ComponentCard title={t("fields")}>
          <dl>
            {user.fields.length ? user.fields.map((f) => <InfoRow key={f.label} label={f.label} value={f.value} />) : <p className="text-sm text-gray-500 dark:text-gray-400">—</p>}
          </dl>
        </ComponentCard>
      </div>
      <PersonTickets
        agent={agent}
        criterion={["user_id", "equal", user.id]}
        filter={filter}
        basePath={`/agent/users/${user.id}`}
        allHref={`/agent/tickets?user=${user.id}`}
        tz={tz}
        locale={locale}
      />
    </div>
  );
}
