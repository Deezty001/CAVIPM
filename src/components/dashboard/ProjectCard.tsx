"use client";

import Link from "next/link";
import { MapPin, Layers, AlertCircle, Clock, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  PHASE_NAMES,
  PHASE_BAR_COLORS,
  PROJECT_TYPE_LABELS,
} from "@/lib/utils";
import { isOverdue } from "@/lib/dates";

type PhaseStats = {
  name: string;
  total: number;
  done: number;
  blocked: number;
};

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    address: string;
    suburb: string;
    type: string;
    lotCount: number | null;
    status: string;
    phases: {
      order: number;
      tasks: {
        status: string;
        dueDate: Date | null;
        subtasks: { status: string; dueDate: Date | null }[];
      }[];
    }[];
  };
  index: number;
};

function computePhaseStats(phases: ProjectCardProps["project"]["phases"]): PhaseStats[] {
  return PHASE_NAMES.map((name, i) => {
    const phase = phases.find((p) => p.order === i);
    if (!phase) return { name, total: 0, done: 0, blocked: 0 };
    let total = 0, done = 0, blocked = 0;
    for (const t of phase.tasks) {
      total++;
      if (t.status === "DONE") done++;
      if (t.status === "BLOCKED") blocked++;
      for (const s of t.subtasks) {
        total++;
        if (s.status === "DONE") done++;
        if (s.status === "BLOCKED") blocked++;
      }
    }
    return { name, total, done, blocked };
  });
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const phaseStats = computePhaseStats(project.phases);
  const totalTasks = phaseStats.reduce((a, p) => a + p.total, 0);
  const doneTasks = phaseStats.reduce((a, p) => a + p.done, 0);
  const blockedTasks = phaseStats.reduce((a, p) => a + p.blocked, 0);
  const overdueTasks = project.phases.flatMap((p) =>
    p.tasks.filter((t) => isOverdue(t.dueDate, t.status))
  ).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={`surface-card group block opacity-0 transition-transform duration-150 hover:-translate-y-0.5 animate-fade-up ${staggerClass}`}
    >
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="mb-1 truncate text-[17px] font-bold leading-[1.3] tracking-[-0.2px]"
            >
              {project.name}
            </h3>
            <div
              className="flex items-center gap-1 text-xs text-[#6b6b6b]"
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{project.suburb || project.address}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              className={
                project.status === "ACTIVE"
                  ? "bg-[#ebf5ee] text-[#3d7a55] border-transparent"
                  : project.status === "ON_HOLD"
                  ? "bg-[#f7f0e5] text-[#96702a] border-transparent"
                  : "bg-[#f0f0ee] text-[#6b6b6b] border-transparent"
              }
            >
              {project.status === "ACTIVE"
                ? "Active"
                : project.status === "ON_HOLD"
                ? "On Hold"
                : "Complete"}
            </Badge>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5f5f3] text-[#6b6b6b] transition-colors group-hover:bg-[#111111] group-hover:text-white">
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </span>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <span
            className="rounded-full bg-[#f0f0ee] px-2 py-[3px] text-[11px] font-medium text-[#6b6b6b]"
          >
            {PROJECT_TYPE_LABELS[project.type] ?? project.type}
          </span>
          {project.lotCount && (
            <span
              className="flex items-center gap-1 text-xs text-[#6b6b6b]"
            >
              <Layers className="w-3 h-3" />
              {project.lotCount} lots
            </span>
          )}
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#6b6b6b]">Overall progress</span>
            <span className="font-semibold text-[#111111]">{pct}%</span>
          </div>
          <div className="flex gap-1" aria-label="Phase progress">
          {phaseStats.map((phase, i) => {
            const phasePct = phase.total > 0 ? (phase.done / phase.total) * 100 : 0;
            return (
              <div key={i} className="flex-1" title={`${phase.name}: ${Math.round(phasePct)}%`}>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[#ebebeb]"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${PHASE_BAR_COLORS[i]}`}
                    style={{ width: `${phasePct}%` }}
                  />
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div className="flex min-h-5 items-center justify-between border-t pt-4" style={{ borderColor: "var(--divider)" }}>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6b6b6b]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#3d7a55]" strokeWidth={1.5} />
              {doneTasks}/{totalTasks}
            </span>
            {blockedTasks > 0 && (
              <span className="flex items-center gap-1 font-medium text-[#a03535]">
                <AlertCircle className="w-3.5 h-3.5" />
                {blockedTasks} blocked
              </span>
            )}
            {overdueTasks > 0 && (
              <span className="flex items-center gap-1 font-medium text-[#96702a]">
                <Clock className="w-3.5 h-3.5" />
                {overdueTasks} overdue
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#a0a0a0]">Open project</span>
        </div>
      </div>
    </Link>
  );
}
