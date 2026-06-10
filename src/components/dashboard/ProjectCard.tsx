"use client";

import Link from "next/link";
import { MapPin, Layers, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  PHASE_NAMES,
  PHASE_BAR_COLORS,
  STATUS_CONFIG,
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

  const activePhaseIdx = phaseStats.findIndex(
    (p, i) => p.total > 0 && p.done < p.total
  );

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={`block rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-up ${staggerClass} opacity-0`}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3
              className="font-semibold text-base truncate leading-tight mb-1"
              style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}
            >
              {project.name}
            </h3>
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{project.suburb || project.address}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              className={
                project.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : project.status === "ON_HOLD"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }
            >
              {project.status === "ACTIVE"
                ? "Active"
                : project.status === "ON_HOLD"
                ? "On Hold"
                : "Complete"}
            </Badge>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs px-2 py-0.5 rounded-md border"
            style={{
              background: "var(--bg-muted)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {PROJECT_TYPE_LABELS[project.type] ?? project.type}
          </span>
          {project.lotCount && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <Layers className="w-3 h-3" />
              {project.lotCount} lots
            </span>
          )}
        </div>

        {/* Phase progress bars */}
        <div className="flex gap-1 mb-4" aria-label="Phase progress">
          {phaseStats.map((phase, i) => {
            const phasePct = phase.total > 0 ? (phase.done / phase.total) * 100 : 0;
            return (
              <div key={i} className="flex-1" title={`${phase.name}: ${Math.round(phasePct)}%`}>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-muted)" }}
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

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {doneTasks}/{totalTasks}
            </span>
            {blockedTasks > 0 && (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {blockedTasks} blocked
              </span>
            )}
            {overdueTasks > 0 && (
              <span className="flex items-center gap-1 text-orange-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {overdueTasks} overdue
              </span>
            )}
          </div>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: "var(--accent)" }}
          >
            {pct}%
          </span>
        </div>
      </div>
    </Link>
  );
}
