import { ArrowLeft, Pencil } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import { WriteGate } from "@/components/common/WriteGate";
import PortalThread from "@/components/portal/PortalThread";
import ReplyForm from "@/components/portal/ReplyForm";
import { InfoItem, InfoList, Panel, StatusBadge } from "@/components/portal/PortalUi";
import { BTN_SECONDARY, FOCUS, TEXT_LINK } from "@/components/portal/styles";
import Alert from "@/components/ui/alert/Alert";
import { Link } from "@/i18n/navigation";
import { FormType } from "@/lib/osticket/object-types";
import { parseId } from "@/lib/route-id";
import { sessionClient } from "@/server/auth/client-auth";
import { coreConfig } from "@/server/config/config";
import { db } from "@/server/db";
import { loadClientTicketView } from "@/server/domain/client/ticket-view";
import { clientCanAccess } from "@/server/domain/client/tickets";
import { threadUploadRules } from "@/server/domain/file/upload";
import { loadFormDef } from "@/server/domain/forms/load";
import { formatDbDate } from "@/server/format/datetime";
import { cn } from "@/utils";

import { requireClient } from "../../guard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = (await getTranslations("portal.ticket"))("title");
  // il numero va nel titolo solo se il visitatore può vedere il ticket (stesso controllo della vista)
  const ticketId = parseId(id);
  const client = ticketId ? await sessionClient() : null;
  const row =
    client && ticketId && (await clientCanAccess(client, ticketId)) ? await db().selectFrom("ticket").select("number").where("ticket_id", "=", ticketId).executeTakeFirst() : undefined;
  return { title: row ? `#${row.number}` : title };
}

const EVENTS = ["created", "closed", "reopened", "edited", "collab", "merged"] as const;

/**
 * Vista del ticket per il cliente (view.inc.php): informazioni di base, campi visibili ai clienti,
 * thread senza note interne e risposta (se aperto o chiuso ma riapribile; non per i figli di un merge).
 */
export default async function ClientTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ posted?: string; created?: string; edited?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const client = await requireClient(locale, `/tickets/${id}`);
  const t = await getTranslations("portal.ticket");
  const cfg = await coreConfig();
  const view = await loadClientTicketView(cfg, client, parseId(id) ?? 0);
  if (!view) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title={t("notFound")} message="" />
        <Link href="/tickets" className={cn("inline-flex items-center gap-1.5 text-theme-sm", TEXT_LINK)}>
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("back")}
        </Link>
      </div>
    );
  }
  const tz = client.account?.timezone || cfg.str("default_timezone") || "UTC";
  const tform = await loadFormDef(db(), cfg, { type: FormType.TICKET }, "client");
  const message = tform?.fields.find((f) => f.type === "thread");
  const rules = threadUploadRules(cfg);
  const eventLabels = Object.fromEntries(EVENTS.map((e) => [e, t(`events.${e}`)]));

  return (
    <div className="space-y-6">
      {client.guest && ["public", "auto"].includes(cfg.str("client_registration")) && (
        <Alert variant="info" title={t("guestTitle")} message={t("guestText")} showLink linkHref="/account" linkText={t("register")} />
      )}
      {sp.created && <Alert variant="success" title={t("created")} message="" />}
      {sp.edited && (
        <div>
          <Alert variant="success" title={t("editSaved")} message="" />
        </div>
      )}

      <div className="space-y-3">
        {!client.guest && (
          <Link href="/tickets" className={cn("inline-flex items-center gap-1.5 rounded text-theme-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white", FOCUS)}>
            <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {t("back")}
          </Link>
        )}
        <PageHeader
          title={view.subject}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="tabular-nums">#{view.number}</span>
              <StatusBadge state={view.state}>{view.statusName}</StatusBadge>
            </span>
          }
          actions={
            view.canEdit && (
              <WriteGate>
                <Link href={`/tickets/${view.id}/edit`} className={BTN_SECONDARY}>
                  <Pencil aria-hidden="true" className="size-4" />
                  {t("edit")}
                </Link>
              </WriteGate>
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* dettagli: sopra il thread su mobile, a lato da desktop */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:order-last">
          <Panel title={t("basic")} className="sm:p-5">
            <InfoList>
              <InfoItem label={t("status")}>{view.statusName}</InfoItem>
              <InfoItem label={t("dept")}>{view.dept}</InfoItem>
              <InfoItem label={t("createDate")}>
                <span className="tabular-nums">{formatDbDate(view.created, tz, locale, "full")}</span>
              </InfoItem>
            </InfoList>
          </Panel>
          <Panel title={t("user")} className="sm:p-5">
            <InfoList>
              <InfoItem label={t("name")}>{view.ownerName}</InfoItem>
              <InfoItem label={t("email")}>{view.ownerEmail}</InfoItem>
              {/* valore vuoto o di soli spazi: "—" come nelle altre righe */}
              <InfoItem label={t("phone")}>{view.ownerPhone.trim()}</InfoItem>
            </InfoList>
          </Panel>
          {view.answers.length > 0 && (
            <Panel className="sm:p-5">
              <InfoList>
                {view.answers.map((a, i) => (
                  <InfoItem key={i} label={a.label}>
                    {a.value}
                  </InfoItem>
                ))}
              </InfoList>
            </Panel>
          )}
        </aside>

        <div className="min-w-0 space-y-6 lg:col-span-2">
          <PortalThread
            entries={view.entries}
            events={view.events}
            tz={tz}
            locale={locale}
            hideStaffName={cfg.bool("hide_staff_name")}
            labels={{ posted: t("postedLabel"), staff: t("staff"), edited: t("editedLabel"), events: eventLabels }}
          />

          {view.parentId ? (
            <Alert variant="warning" title={t("merged")} message="" showLink linkHref={`/tickets/${view.parentId}`} linkText={t("parent")} />
          ) : view.closedNotReopenable ? (
            <Alert variant="warning" title={t("closedNotReopenable")} message="" />
          ) : null}
          {/* key: un messaggio inviato aggiunge una voce al thread e il form si rimonta vuoto; l'esito ?posted è
              mostrato nel form stesso, dove porta il redirect a #reply */}
          {view.canReply && (
            <ReplyForm key={view.entries.length} posted={!!sp.posted} ticketId={view.id} reopen={view.reopenOnReply} attachments={!!message?.config.attachments} maxFileSize={rules?.size ?? 0} />
          )}
        </div>
      </div>
    </div>
  );
}
