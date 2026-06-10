import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export const PHASE_NAMES = [
  "Planning & Approvals",
  "Civil Engineering",
  "Construction",
  "Subdivision & Titles",
  "Sales & Marketing",
  "Accounts & Admin",
] as const;

export const PHASE_COLORS = [
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-slate-100 text-slate-700 border-slate-200",
] as const;

export const PHASE_BAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-slate-500",
] as const;

export const PHASE_GANTT_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#64748b",
] as const;

export const STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  DONE: {
    label: "Done",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-red-100 text-red-700 border-red-200",
  },
} as const;

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", className: "text-slate-400" },
  NORMAL: { label: "Normal", className: "text-slate-600" },
  HIGH: { label: "High", className: "text-amber-600" },
  URGENT: { label: "Urgent", className: "text-red-600" },
} as const;

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL_SUBDIVISION: "Residential Subdivision",
  TOWNHOUSE_DEVELOPMENT: "Townhouse Development",
  MIXED_USE: "Mixed Use",
  COMMERCIAL: "Commercial",
  RENOVATION: "Renovation",
};

export const MEETING_TYPE_LABELS: Record<string, string> = {
  WORKSHOP_AGENDA: "Workshop Agenda",
  PROGRESS_MEETING: "Progress Meeting",
  CONSULTANT_BRIEFING: "Consultant Briefing",
  SITE_MEETING: "Site Meeting",
  OTHER: "Other",
};

export function getStatusCycle(current: string): string {
  const cycle = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}
