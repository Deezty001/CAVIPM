import { isBusinessDay } from "./holidays";

/** Add N business days to a date, returning a new Date */
export function addBusinessDays(start: Date, days: number): Date {
  const date = new Date(start);
  date.setHours(0, 0, 0, 0);
  let remaining = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  while (remaining > 0) {
    date.setDate(date.getDate() + direction);
    if (isBusinessDay(date)) remaining--;
  }
  return date;
}

/** Count business days between two dates (inclusive of start, exclusive of end) */
export function countBusinessDays(start: Date, end: Date): number {
  const from = new Date(Math.min(start.getTime(), end.getTime()));
  const to = new Date(Math.max(start.getTime(), end.getTime()));
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  let count = 0;
  const cur = new Date(from);
  while (cur < to) {
    if (isBusinessDay(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return start <= end ? count : -count;
}

/** Subtract N business days from a date */
export function subtractBusinessDays(end: Date, days: number): Date {
  return addBusinessDays(end, -days);
}

/** Find nearest business day — returns same date if already a business day */
export function nearestBusinessDay(date: Date, prefer: "forward" | "backward" = "forward"): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (isBusinessDay(d)) return d;

  const fwd = new Date(d);
  while (!isBusinessDay(fwd)) fwd.setDate(fwd.getDate() + 1);

  const bwd = new Date(d);
  while (!isBusinessDay(bwd)) bwd.setDate(bwd.getDate() - 1);

  return prefer === "forward" ? fwd : bwd;
}

/** Format duration for display */
export function formatDuration(businessDays: number): string {
  if (businessDays >= 20) return `${Math.round(businessDays / 20)} mo`;
  if (businessDays >= 10) return `${Math.round(businessDays / 5)} wks`;
  return `${businessDays} bd`;
}

/** Format date in Australian format DD/MM/YYYY */
export function formatAUDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Parse AU date string DD/MM/YYYY to Date */
export function parseAUDate(str: string): Date | null {
  const [day, month, year] = str.split("/").map(Number);
  if (!day || !month || !year) return null;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

/** Check if a date is overdue (past today, not completed) */
export function isOverdue(dueDate: Date | string | null | undefined, status: string): boolean {
  if (!dueDate || status === "DONE") return false;
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}
