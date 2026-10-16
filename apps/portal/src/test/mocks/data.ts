/**
 * Deterministic fixture data for MSW (dev demo + tests). Shapes follow the generated API schema,
 * or the FRD-based proposal in features/dashboard/schemas.ts for endpoints the API lacks.
 * All people here are fictional.
 */
import type { Schemas } from "@/lib/api.ts";
import { PERMISSIONS } from "@/shared/constants/permissions.ts";

export const MOCK_PASSWORD = "Correct-Horse-9";
export const MOCK_MFA_CODE = "123456";
export const VALID_RESET_TOKEN = "valid-reset-token-0001";
export const TENANT_ID = "00000000-0000-4000-8000-000000000001";

export const tenant: Schemas["TenantPublicOut"] = {
  slug: "sunrise",
  name: "Sunrise Public School",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export interface MockUser {
  me: Schemas["MeResponse"];
}

function user(
  id: number,
  email: string,
  fullName: string,
  roles: string[],
  permissions: string[],
  mfa = false,
): MockUser {
  return {
    me: {
      id: `00000000-0000-4000-8000-1000000000${String(id).padStart(2, "0")}`,
      tenant_id: TENANT_ID,
      email,
      full_name: fullName,
      mfa_enabled: mfa,
      roles,
      permissions,
    },
  };
}

export const users: readonly MockUser[] = [
  user(1, "admin@school.test", "Asha Raman", ["admin"], ALL_PERMISSIONS),
  user(2, "principal@school.test", "Dr. Meera Iyer", ["principal"], ALL_PERMISSIONS, true),
  user(
    3,
    "teacher@school.test",
    "Rahul Verma",
    ["teacher"],
    [PERMISSIONS.studentsRead, PERMISSIONS.tenantRead],
  ),
  user(4, "parent@school.test", "Sunita Sharma", ["parent"], []),
  user(5, "viewer@school.test", "Kiran Das", ["viewer"], []),
];

const FIRST = [
  "Aarav",
  "Diya",
  "Vivaan",
  "Ananya",
  "Ishaan",
  "Saanvi",
  "Kabir",
  "Myra",
  "Arjun",
  "Riya",
  "Rohan",
  "Priya",
  "Karan",
  "Meera",
  "Aditya",
  "Neha",
  "Vikram",
  "Sneha",
  "Farhan",
  "Zoya",
  "Joseph",
  "Anjali",
  "Sourav",
  "Ritika",
  "অনন্যা",
  "Tenzin",
];
const LAST = [
  "Sharma",
  "Iyer",
  "Nair",
  "Reddy",
  "Gupta",
  "Singh",
  "Patel",
  "Khan",
  "Das",
  "Bose",
  "Menon",
  "Banerjee",
  "Mukherjee",
  "Ghosh",
  "Chatterjee",
  "চট্টোপাধ্যায়",
  null,
];
const STATUSES = [
  "enrolled",
  "enrolled",
  "enrolled",
  "enrolled",
  "provisional",
  "withdrawn",
  "transferred",
  "alumni",
];
const GENDERS = ["female", "male"];

function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}

export function makeStudents(count = 137): Schemas["StudentOut"][] {
  return Array.from({ length: count }, (_, i) => {
    const grade = (i % 10) + 1;
    const year = 2026 - grade - 6;
    const timestamp = `2026-04-${pad((i % 28) + 1)}T09:${pad(i % 60)}:00Z`;
    return {
      id: `10000000-0000-4000-8000-${pad(i + 1, 12)}`,
      admission_no: `SPS/2026/${pad(i + 1, 4)}`,
      first_name: FIRST[i % FIRST.length] ?? "Aarav",
      middle_name: i % 9 === 0 ? "Kumar" : null,
      last_name: LAST[(i * 7) % LAST.length] ?? null,
      date_of_birth: `${String(year)}-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
      gender: GENDERS[i % 2] ?? "female",
      admission_date: `20${pad(20 + (i % 6))}-04-01`,
      status: STATUSES[i % STATUSES.length] ?? "enrolled",
      current_grade: String(grade),
      section: ["A", "B", "C"][i % 3] ?? "A",
      created_at: timestamp,
      updated_at: timestamp,
    };
  });
}

function isoDaysAgo(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function adminDashboard(now = new Date()) {
  return {
    as_of: now.toISOString(),
    stats: {
      students_enrolled: 1248,
      attendance_today_pct: 93.4,
      fees_collected_mtd: "1842500.00",
      fees_target_mtd: "2500000.00",
      pending_approvals: 7,
    },
    attendance_trend: Array.from({ length: 14 }, (_, i) => ({
      date: isoDaysAgo(13 - i, now),
      present_pct: Math.round((90 + 5 * Math.sin(i / 2) + (i % 3)) * 10) / 10,
    })),
    unmarked_sections: [
      { section: "7B", teacher: "Rahul Verma" },
      { section: "9A", teacher: "Farah Siddiqui" },
    ],
    upcoming_events: [
      { id: "e1", title: "Parent–teacher meeting (Classes 6–8)", date: isoDaysAgo(-3, now) },
      { id: "e2", title: "Annual sports day", date: isoDaysAgo(-10, now) },
      { id: "e3", title: "Half-yearly exams begin", date: isoDaysAgo(-18, now) },
    ],
    recent_notices: [
      {
        id: "n1",
        title: "Winter uniform from 1 November",
        published_at: `${isoDaysAgo(1, now)}T08:30:00+05:30`,
        read_pct: 72,
      },
      {
        id: "n2",
        title: "Diwali holidays: school closed 20–24 October",
        published_at: `${isoDaysAgo(4, now)}T10:00:00+05:30`,
        read_pct: 91,
      },
      {
        id: "n3",
        title: "Bus route 4 timing change",
        published_at: `${isoDaysAgo(6, now)}T07:15:00+05:30`,
        read_pct: 58,
      },
    ],
  };
}

export function teacherDashboard(now = new Date()) {
  return {
    as_of: now.toISOString(),
    today: [
      {
        period: 1,
        start: "08:00",
        end: "08:40",
        subject: "Mathematics",
        section: "7B",
        room: "R-12",
      },
      {
        period: 2,
        start: "08:45",
        end: "09:25",
        subject: "Mathematics",
        section: "8A",
        room: "R-15",
      },
      { period: 4, start: "10:20", end: "11:00", subject: "Science", section: "7B", room: "Lab 2" },
      {
        period: 6,
        start: "12:10",
        end: "12:50",
        subject: "Mathematics",
        section: "6C",
        room: null,
      },
    ],
    attendance_pending: [{ section_id: "s-7b", section: "7B" }],
    marks_pending: 2,
    unread_messages: 5,
    homework_today: 1,
  };
}

export function parentDashboard(now = new Date()) {
  return {
    as_of: now.toISOString(),
    children: [
      {
        id: "c1",
        name: "Ananya Sharma",
        class_section: "Class 7 · B",
        attendance_today: "present",
        attendance_pct: 96.2,
        dues: "12500.00",
        due_date: isoDaysAgo(-9, now),
        latest_notice: {
          title: "Winter uniform from 1 November",
          published_at: `${isoDaysAgo(1, now)}T08:30:00+05:30`,
        },
        latest_result: { exam: "Unit Test 2", grade: "A1" },
      },
      {
        id: "c2",
        name: "Kabir Sharma",
        class_section: "Class 3 · A",
        attendance_today: "not_marked",
        attendance_pct: 91.8,
        dues: "0.00",
        due_date: null,
        latest_notice: null,
        latest_result: null,
      },
    ],
  };
}
