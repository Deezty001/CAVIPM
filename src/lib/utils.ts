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
  "bg-[#eeeaf7] text-[#534a82] border-[#ded7ef]",
  "bg-[#ebf0f7] text-[#2d4f7c] border-[#d8e1ed]",
  "bg-[#f5ede7] text-[#8a4e38] border-[#ead9cf]",
  "bg-[#ebf5ee] text-[#3d7a55] border-[#d7eadc]",
  "bg-[#f7f0e5] text-[#96702a] border-[#eadfc8]",
  "bg-[#f0f0ee] text-[#6b6b6b] border-[#e0e0de]",
] as const;

export const PHASE_BAR_COLORS = [
  "bg-[#7a6faf]",
  "bg-[#4a6fa5]",
  "bg-[#b8735a]",
  "bg-[#3d7a55]",
  "bg-[#96702a]",
  "bg-[#a0a0a0]",
] as const;

export const PHASE_GANTT_COLORS = [
  "#7a6faf",
  "#4a6fa5",
  "#b8735a",
  "#3d7a55",
  "#96702a",
  "#a0a0a0",
] as const;

export const STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    className: "bg-[#f0f0ee] text-[#6b6b6b] border-[#e0e0de]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-[#f5ede7] text-[#8a4e38] border-[#ead9cf]",
  },
  DONE: {
    label: "Done",
    className: "bg-[#ebf5ee] text-[#3d7a55] border-[#d7eadc]",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-[#f7ebeb] text-[#a03535] border-[#ecd3d3]",
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
