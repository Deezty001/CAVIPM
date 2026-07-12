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
  "bg-purple-50 text-purple-700 border-purple-100",
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-slate-50 text-slate-600 border-slate-200",
] as const;

export const PHASE_BAR_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-slate-400",
] as const;

export const PHASE_GANTT_COLORS = [
  "#8c7b8e", // Warm Plum/Taupe
  "#4b7754", // Sage Green
  "#b85c4c", // Terracotta Red
  "#467a6d", // Soft Teal
  "#d08b3c", // Muted Ochre
  "#7d756b", // Warm Sand-brown
] as const;

export const STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-orange-50 text-orange-700 border-orange-150",
  },
  DONE: {
    label: "Done",
    className: "bg-emerald-50 text-emerald-700 border-emerald-150",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-red-50 text-red-700 border-red-150",
  },
  WAITING: {
    label: "Waiting",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-50 text-slate-400 border-slate-200",
  },
} as const;

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", className: "text-slate-400 font-medium" },
  NORMAL: { label: "Normal", className: "text-slate-600 font-medium" },
  HIGH: { label: "High", className: "text-amber-600 font-bold" },
  URGENT: { label: "Urgent", className: "text-red-600 font-bold" },
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
