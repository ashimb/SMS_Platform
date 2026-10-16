/**
 * Portal modules: one registry drives the router guards, the sidebar, the bottom navigation and
 * the command palette, so they can never disagree about who sees what.
 *
 * `portals` = which role experiences list the module; `permission` = additionally required
 * permission. Both only shape the UI; the API authorizes every request itself.
 */
import {
  BookOpen,
  BookUser,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  Globe,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  ScrollText,
  Settings,
  UserPlus,
  UsersRound,
  Wallet,
} from "lucide-react";

import { type Permission, PERMISSIONS } from "@/shared/constants/permissions.ts";
import type { PortalKind } from "@/shared/constants/roles.ts";
import { ROUTES } from "@/shared/constants/routes.ts";

export type ModuleKey =
  | "dashboard"
  | "students"
  | "guardians"
  | "staff"
  | "academics"
  | "timetable"
  | "attendance"
  | "exams"
  | "admissions"
  | "fees"
  | "communication"
  | "cms"
  | "reports"
  | "settings"
  | "audit";

export interface ModuleDef {
  key: ModuleKey;
  path: string;
  icon: LucideIcon;
  portals: readonly PortalKind[];
  permission?: Permission;
}

const ALL: readonly PortalKind[] = ["admin", "teacher", "parent"];
const STAFF: readonly PortalKind[] = ["admin", "teacher"];
const ADMIN: readonly PortalKind[] = ["admin"];

export const MODULES: Record<ModuleKey, ModuleDef> = {
  dashboard: { key: "dashboard", path: ROUTES.home, icon: LayoutDashboard, portals: ALL },
  students: {
    key: "students",
    path: ROUTES.students,
    icon: UsersRound,
    portals: STAFF,
    permission: PERMISSIONS.studentsRead,
  },
  guardians: { key: "guardians", path: ROUTES.guardians, icon: BookUser, portals: STAFF },
  staff: { key: "staff", path: ROUTES.staff, icon: Briefcase, portals: ADMIN },
  academics: { key: "academics", path: ROUTES.academics, icon: BookOpen, portals: ADMIN },
  timetable: { key: "timetable", path: ROUTES.timetable, icon: CalendarDays, portals: ALL },
  attendance: { key: "attendance", path: ROUTES.attendance, icon: CalendarCheck, portals: ALL },
  exams: { key: "exams", path: ROUTES.exams, icon: ClipboardCheck, portals: ALL },
  admissions: { key: "admissions", path: ROUTES.admissions, icon: UserPlus, portals: ADMIN },
  fees: { key: "fees", path: ROUTES.fees, icon: Wallet, portals: ["admin", "parent"] },
  communication: {
    key: "communication",
    path: ROUTES.communication,
    icon: Megaphone,
    portals: ALL,
  },
  cms: { key: "cms", path: ROUTES.cms, icon: Globe, portals: ADMIN },
  reports: { key: "reports", path: ROUTES.reports, icon: ChartColumn, portals: ADMIN },
  settings: { key: "settings", path: ROUTES.settings, icon: Settings, portals: ADMIN },
  audit: {
    key: "audit",
    path: ROUTES.audit,
    icon: ScrollText,
    portals: ADMIN,
    permission: PERMISSIONS.auditRead,
  },
};

export interface NavGroup {
  /** i18n key under common:navGroups; null = no heading. */
  labelKey: string | null;
  items: readonly ModuleKey[];
}

/** Sidebar structure per portal (order = importance for that role). */
export const NAVIGATION: Record<PortalKind, readonly NavGroup[]> = {
  admin: [
    { labelKey: null, items: ["dashboard"] },
    { labelKey: "people", items: ["students", "guardians", "staff"] },
    { labelKey: "academics", items: ["academics", "timetable", "attendance", "exams"] },
    { labelKey: "office", items: ["admissions", "fees", "communication"] },
    { labelKey: "website", items: ["cms", "reports"] },
    { labelKey: "administration", items: ["settings", "audit"] },
  ],
  teacher: [
    { labelKey: null, items: ["dashboard"] },
    { labelKey: "classroom", items: ["attendance", "timetable", "exams", "students"] },
    { labelKey: "people", items: ["guardians", "communication"] },
  ],
  parent: [
    { labelKey: null, items: ["dashboard"] },
    { labelKey: "myChildren", items: ["attendance", "timetable", "exams", "fees"] },
    { labelKey: "school", items: ["communication"] },
  ],
};

/** Up to four destinations for the mobile bottom bar; the rest live under "More". */
export const BOTTOM_NAV: Record<PortalKind, readonly ModuleKey[]> = {
  admin: ["dashboard", "students", "attendance", "fees"],
  teacher: ["dashboard", "attendance", "timetable", "exams"],
  parent: ["dashboard", "attendance", "fees", "communication"],
};

export function moduleVisible(
  module: ModuleDef,
  portal: PortalKind,
  permissions: readonly string[],
): boolean {
  return (
    module.portals.includes(portal) &&
    (module.permission === undefined || permissions.includes(module.permission))
  );
}
