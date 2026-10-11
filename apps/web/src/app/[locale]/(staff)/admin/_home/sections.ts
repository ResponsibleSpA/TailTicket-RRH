import {
  Activity,
  AtSign,
  Ban,
  BookOpen,
  Building,
  Building2,
  CalendarClock,
  ClipboardList,
  Contact,
  FileText,
  Filter,
  History,
  KeyRound,
  Layers,
  LayoutTemplate,
  List,
  ListChecks,
  Mails,
  MessagesSquare,
  Palette,
  Puzzle,
  ScrollText,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Ticket,
  Timer,
  UserCog,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/** Conteggi dell'help desk mostrati accanto alle voci (chiavi di adminSummary().counts). */
export type CountKey = "departments" | "topics" | "agents" | "teams" | "roles" | "slas" | "schedules";

interface HubLink {
  /** etichetta: chiave di adminNav (la stessa voce del menu laterale) */
  key: string;
  href: string;
  icon: LucideIcon;
  count?: CountKey;
}

/**
 * Sezioni della home admin, nello stesso ordine e con le stesse voci del menu laterale (layout.tsx):
 * titolo e descrizione della sezione in admHome.hub.<key>, descrizione di ogni voce in admHome.desc.<key>.
 */
export const HUB: { key: string; icon: LucideIcon; links: HubLink[] }[] = [
  {
    key: "settings",
    icon: Settings2,
    links: [
      { key: "company", href: "/admin/settings/company", icon: Building },
      { key: "systemSettings", href: "/admin/settings/system", icon: Settings2 },
      { key: "ticketsSettings", href: "/admin/settings/tickets", icon: Ticket },
      { key: "tasksSettings", href: "/admin/settings/tasks", icon: ListChecks },
      { key: "agentsSettings", href: "/admin/settings/agents", icon: UserCog },
      { key: "usersSettings", href: "/admin/settings/users", icon: Users },
      { key: "kbSettings", href: "/admin/settings/kb", icon: BookOpen },
      { key: "theme", href: "/admin/theme", icon: Palette },
    ],
  },
  {
    key: "staff",
    icon: UsersRound,
    links: [
      { key: "agentsList", href: "/admin/agents", icon: Contact, count: "agents" },
      { key: "teams", href: "/admin/teams", icon: UsersRound, count: "teams" },
      { key: "roles", href: "/admin/roles", icon: ShieldCheck, count: "roles" },
      { key: "departments", href: "/admin/departments", icon: Building2, count: "departments" },
    ],
  },
  {
    key: "manage",
    icon: Layers,
    links: [
      { key: "topics", href: "/admin/topics", icon: MessagesSquare, count: "topics" },
      { key: "filters", href: "/admin/filters", icon: Filter },
      { key: "sla", href: "/admin/sla", icon: Timer, count: "slas" },
      { key: "schedules", href: "/admin/schedules", icon: CalendarClock, count: "schedules" },
      { key: "queues", href: "/admin/queues", icon: Layers },
      { key: "forms", href: "/admin/forms", icon: ClipboardList },
      { key: "lists", href: "/admin/lists", icon: List },
      { key: "pages", href: "/admin/pages", icon: FileText },
      { key: "apikeys", href: "/admin/apikeys", icon: KeyRound },
      { key: "plugins", href: "/admin/plugins", icon: Puzzle },
    ],
  },
  {
    key: "emails",
    icon: Mails,
    links: [
      { key: "emailAccounts", href: "/admin/emails", icon: AtSign },
      { key: "emailSettings", href: "/admin/settings/emails", icon: Mails },
      { key: "templates", href: "/admin/templates", icon: LayoutTemplate },
      { key: "banlist", href: "/admin/banlist", icon: Ban },
      { key: "diagnostic", href: "/admin/emails/diagnostic", icon: Stethoscope },
    ],
  },
  {
    key: "monitor",
    icon: Activity,
    links: [
      { key: "system", href: "/admin/system", icon: Activity },
      { key: "changes", href: "/admin/changes", icon: History },
      { key: "logs", href: "/admin/logs", icon: ScrollText },
    ],
  },
];
