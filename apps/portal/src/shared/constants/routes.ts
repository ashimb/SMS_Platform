/** Route paths in one place, so links and redirects never drift from the router. */
export const ROUTES = {
  home: "/",
  login: "/login",
  mfa: "/login/mfa",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  forbidden: "/403",
  students: "/students",
  studentNew: "/students/new",
  student: (id: string) => `/students/${encodeURIComponent(id)}`,
  studentEdit: (id: string) => `/students/${encodeURIComponent(id)}/edit`,
  guardians: "/guardians",
  staff: "/staff",
  academics: "/academics",
  timetable: "/timetable",
  attendance: "/attendance",
  exams: "/exams",
  admissions: "/admissions",
  fees: "/fees",
  communication: "/communication",
  cms: "/cms",
  reports: "/reports",
  settings: "/settings",
  audit: "/audit",
} as const;

/**
 * Validate a post-login redirect target. Only same-app absolute paths are allowed, which blocks
 * open redirects such as `?next=//evil.example` or `?next=https://evil.example`.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return ROUTES.home;
  }
  // Control characters (e.g. tabs/newlines that browsers strip) can disguise a redirect target.
  if ([...next].some((char) => char.charCodeAt(0) < 0x20)) return ROUTES.home;
  const authPages: string[] = [
    ROUTES.login,
    ROUTES.mfa,
    ROUTES.forgotPassword,
    ROUTES.resetPassword,
  ];
  return authPages.some((page) => next === page || next.startsWith(`${page}?`))
    ? ROUTES.home
    : next;
}
