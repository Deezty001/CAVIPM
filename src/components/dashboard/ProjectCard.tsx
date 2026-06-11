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

export function ProjectCard({ project }: ProjectCardProps) {
  const phaseStats = computePhaseStats(project.phases);
  const totalTasks = phaseStats.reduce((a, p) => a + p.total, 0);
  const doneTasks = phaseStats.reduce((a, p) => a + p.done, 0);
  const blockedTasks = phaseStats.reduce((a, p) => a + p.blocked, 0);
  const overdueTasks = project.phases.flatMap((p) =>
    p.tasks.filter((t) => isOverdue(t.dueDate, t.status))
  ).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="surface-card group block overflow-hidden border border-slate-100 hover:border-slate-200/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full cursor-pointer"
    >
      <div className="p-6 flex flex-col h-full justify-between">
        <div>
          {/* Header section */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="mb-1 truncate text-lg font-bold text-slate-800 font-display transition-colors group-hover:text-blue-600 leading-tight">
                {project.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{project.suburb || project.address}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                className={
                  project.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : project.status === "ON_HOLD"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }
              >
                {project.status === "ACTIVE"
                  ? "Active"
                  : project.status === "ON_HOLD"
                  ? "On Hold"
                  : "Complete"}
              </Badge>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 transition-all duration-300 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white">
                <ArrowUpRight size={14} strokeWidth={2} />
              </span>
            </div>
          </div>

          {/* Details labels */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-100/80 border border-slate-200/35 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {PROJECT_TYPE_LABELS[project.type] ?? project.type}
            </span>
            {project.lotCount && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-700">{project.lotCount}</span> lots
              </span>
            )}
          </div>
        </div>

        <div>
          {/* Progress Section */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Overall Progress</span>
              <span className="text-slate-900 tabular-nums">{pct}%</span>
            </div>
            <div className="flex gap-1" aria-label="Phase progress">
              {phaseStats.map((phase, i) => {
                const phasePct = phase.total > 0 ? (phase.done / phase.total) * 100 : 0;
                return (
                  <div key={i} className="flex-1" title={`${phase.name}: ${Math.round(phasePct)}%`}>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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

          {/* Footer stats section */}
          <div className="flex min-h-[24px] items-center justify-between border-t border-slate-100 pt-4 mt-2">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                {doneTasks}/{totalTasks}
              </span>
              {blockedTasks > 0 && (
                <span className="flex items-center gap-1 font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {blockedTasks} blocked
                </span>
              )}
              {overdueTasks > 0 && (
                <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5" />
                  {overdueTasks} overdue
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Open details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
