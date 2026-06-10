"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  BarChart2,
  CalendarDays,
  Users,
  Settings,
  AlertCircle,
} from "lucide-react";
import { PHASE_NAMES, PHASE_COLORS, PHASE_BAR_COLORS } from "@/lib/utils";
import { isOverdue } from "@/lib/dates";
import { PhaseSection } from "./PhaseSection";
import { ContactsPanel } from "./ContactsPanel";
import { ProjectSettingsModal } from "./ProjectSettingsModal";

type Project = NonNullable<Awaited<ReturnType<typeof import("@/actions/projects").getProject>>>;

export function ProjectDetailClient({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<"tasks" | "contacts">("tasks");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    new Set([0, 1, 2, 3, 4, 5])
  );


  function togglePhase(i: number) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  // Compute totals
  const allTasks = project.phases.flatMap((p) => [
    ...p.tasks,
    ...p.tasks.flatMap((t) => t.subtasks),
  ]);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const blockedTasks = allTasks.filter((t) => t.status === "BLOCKED").length;
  const overdueTasks = allTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Phase stats for strip
  const phaseStats = PHASE_NAMES.map((name, i) => {
    const phase = project.phases.find((p) => p.order === i);
    if (!phase) return { name, total: 0, done: 0, blocked: 0 };
    const tasks = [...phase.tasks, ...phase.tasks.flatMap((t) => t.subtasks)];
    return {
      name,
      total: tasks.length,
      done: tasks.filter((t) => t.status === "DONE").length,
      blocked: tasks.filter((t) => t.status === "BLOCKED").length,
    };
  });

  const statusLabel = project.status === "ACTIVE"
    ? "Active"
    : project.status === "ON_HOLD"
    ? "On Hold"
    : "Complete";

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronLeft className="w-4 h-4" />
        Projects
      </Link>

      {/* Project header */}
      <div
        className="rounded-xl border p-5 mb-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="text-xl font-bold truncate"
                style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}
              >
                {project.name}
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                  project.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : project.status === "ON_HOLD"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {[project.address, project.suburb].filter(Boolean).join(", ")}
              {project.lotCount && ` · ${project.lotCount} lots`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/projects/${project.id}/gantt`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Gantt
            </Link>
            <Link
              href={`/projects/${project.id}/meetings`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Meetings
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)" }}
              aria-label="Project settings"
            >
              <Settings
                className="w-3.5 h-3.5"
                style={{ color: "var(--text-muted)" }}
              />
            </button>
          </div>
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex-1 h-2 rounded-full overflow-hidden"
            style={{ background: "var(--bg-muted)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "var(--accent)" }}
            />
          </div>
          <span
            className="text-sm font-semibold tabular-nums w-10 text-right"
            style={{ color: "var(--accent)" }}
          >
            {pct}%
          </span>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{doneTasks}/{totalTasks} tasks done</span>
          {blockedTasks > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {blockedTasks} blocked
            </span>
          )}
          {overdueTasks > 0 && (
            <span className="text-orange-500 font-medium">{overdueTasks} overdue</span>
          )}
        </div>
      </div>

      {/* Phase strip */}
      <div
        className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-5"
      >
        {phaseStats.map((phase, i) => {
          const phasePct = phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0;
          return (
            <button
              key={i}
              onClick={() => {
                if (!expandedPhases.has(i)) togglePhase(i);
                document.getElementById(`phase-${i}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={`text-left p-3 rounded-xl border transition-all hover:shadow-sm`}
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className={`text-xs font-semibold mb-1.5 truncate ${PHASE_COLORS[i].split(" ")[1]}`}
              >
                {phase.name.split(" ")[0]}
              </div>
              <div
                className="h-1 rounded-full overflow-hidden mb-1.5"
                style={{ background: "var(--bg-muted)" }}
              >
                <div
                  className={`h-full rounded-full ${PHASE_BAR_COLORS[i]}`}
                  style={{ width: `${phasePct}%` }}
                />
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {phasePct}%
                {phase.blocked > 0 && (
                  <span className="text-red-500 ml-1">· {phase.blocked} ⚠</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 border-b mb-5"
        style={{ borderColor: "var(--border)" }}
      >
        {[
          { key: "tasks", label: "Tasks", icon: <BarChart2 className="w-3.5 h-3.5" /> },
          {
            key: "contacts",
            label: `Team (${project.contacts.length})`,
            icon: <Users className="w-3.5 h-3.5" />,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as never)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px`}
            style={{
              borderBottomColor:
                activeTab === tab.key ? "var(--accent)" : "transparent",
              color:
                activeTab === tab.key
                  ? "var(--accent)"
                  : "var(--text-secondary)",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "tasks" && (
        <div className="flex flex-col gap-3">
          {project.phases
            .sort((a, b) => a.order - b.order)
            .map((phase, i) => (
              <PhaseSection
                key={phase.id}
                phase={phase as never}
                phaseIndex={phase.order}
                projectId={project.id}
                contacts={project.contacts}
                expanded={expandedPhases.has(phase.order)}
                onToggle={() => togglePhase(phase.order)}
              />
            ))}
        </div>
      )}

      {activeTab === "contacts" && (
        <ContactsPanel
          contacts={project.contacts}
          projectId={project.id}
        />
      )}

      <ProjectSettingsModal
        project={project}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
