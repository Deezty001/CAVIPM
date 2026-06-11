"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Settings,
  Users,
} from "lucide-react";
import { PHASE_BAR_COLORS } from "@/lib/utils";
import { formatAUDate, isOverdue } from "@/lib/dates";
import { PhaseSection } from "./PhaseSection";
import { ContactsPanel } from "./ContactsPanel";
import { ProjectSettingsModal } from "./ProjectSettingsModal";
import { Button } from "@/components/ui/Button";

type Project = NonNullable<Awaited<ReturnType<typeof import("@/actions/projects").getProject>>>;

export function ProjectDetailClient({ project }: { project: Project }) {
  const orderedPhases = [...project.phases].sort((a, b) => a.order - b.order);
  const initialPhase = orderedPhases.find((phase) =>
    phase.tasks.some((task) => task.status !== "DONE")
  )?.order ?? orderedPhases[0]?.order ?? 0;

  const [activeTab, setActiveTab] = useState<"tasks" | "contacts">("tasks");
  const [selectedPhase, setSelectedPhase] = useState(initialPhase);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const allTasks = orderedPhases.flatMap((phase) => [
    ...phase.tasks,
    ...phase.tasks.flatMap((task) => task.subtasks),
  ]);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((task) => task.status === "DONE").length;
  const blockedTasks = allTasks.filter((task) => task.status === "BLOCKED").length;
  const overdueTasks = allTasks.filter((task) => isOverdue(task.dueDate, task.status)).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const phaseStats = orderedPhases.map((phase) => {
    const tasks = [...phase.tasks, ...phase.tasks.flatMap((task) => task.subtasks)];
    const done = tasks.filter((task) => task.status === "DONE").length;
    return {
      phase,
      total: tasks.length,
      done,
      blocked: tasks.filter((task) => task.status === "BLOCKED").length,
      overdue: tasks.filter((task) => isOverdue(task.dueDate, task.status)).length,
      progress: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
    };
  });

  const attentionItems = orderedPhases
    .flatMap((phase) =>
      [...phase.tasks, ...phase.tasks.flatMap((task) => task.subtasks)].map((task) => ({
        task,
        phaseName: phase.name,
        overdue: isOverdue(task.dueDate, task.status),
      }))
    )
    .filter(({ task, overdue }) => task.status === "BLOCKED" || overdue)
    .sort((a, b) => {
      if (a.task.status === "BLOCKED" && b.task.status !== "BLOCKED") return -1;
      if (b.task.status === "BLOCKED" && a.task.status !== "BLOCKED") return 1;
      return (a.task.dueDate?.getTime() ?? Infinity) - (b.task.dueDate?.getTime() ?? Infinity);
    })
    .slice(0, 5);

  const activePhase = phaseStats.find(({ phase }) => phase.order === selectedPhase) ?? phaseStats[0];
  const statusLabel =
    project.status === "ACTIVE" ? "Active" : project.status === "ON_HOLD" ? "On hold" : "Complete";

  return (
    <div className="app-page max-w-[1240px] px-4 py-8 md:px-8">
      {/* Back Breadcrumb */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
        Back to projects
      </Link>

      {/* Header section */}
      <header className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-start border-b border-slate-100 pb-6">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display sm:text-4xl">
              {project.name}
            </h1>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                project.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : project.status === "ON_HOLD"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-[13px] font-medium text-slate-500">
            {[project.address, project.suburb].filter(Boolean).join(", ")}
            {project.lotCount ? ` · ${project.lotCount} lots` : ""}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/projects/${project.id}/gantt`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            <BarChart3 className="h-4 w-4 text-slate-500" strokeWidth={2} />
            Gantt Chart
          </Link>
          <Link
            href={`/projects/${project.id}/meetings`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            <CalendarDays className="h-4 w-4 text-slate-500" strokeWidth={2} />
            Meetings
          </Link>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] cursor-pointer"
            aria-label="Project settings"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Mini Stats and Alerts */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Progress Card */}
        <section className="surface-card border border-slate-100 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Project Progress</p>
                <p className="text-3xl font-extrabold leading-none tracking-tight text-slate-900 font-display">{progress}%</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-right">
                <ProjectMetric label="Done" value={doneTasks} />
                <ProjectMetric label="Blocked" value={blockedTasks} tone="error" />
                <ProjectMetric label="Overdue" value={overdueTasks} tone="warning" />
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between text-xs font-semibold text-slate-500">
            <span>{doneTasks} of {totalTasks} tasks complete</span>
            <span>{orderedPhases.length} phases</span>
          </div>
        </section>

        {/* Needs Attention Card */}
        <section className="surface-card border border-slate-100 p-6 rounded-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 font-display">Needs Attention</h2>
              <p className="text-xs text-slate-500">Critical blocked and overdue items</p>
            </div>
            {attentionItems.length > 0 && (
              <span className="rounded-full bg-red-50 border border-red-150 px-2 py-0.5 text-[11px] font-bold text-red-600">
                {attentionItems.length}
              </span>
            )}
          </div>
          {attentionItems.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 px-4 py-4 text-emerald-800 h-[80px]">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
              <p className="text-xs font-semibold">Everything looks good. No issues need attention!</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {attentionItems.map(({ task, phaseName, overdue }) => (
                <button
                  key={task.id}
                  onClick={() => {
                    const phase = orderedPhases.find((item) => item.name === phaseName);
                    if (phase) setSelectedPhase(phase.order);
                    setActiveTab("tasks");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-50 px-3 py-2 text-left transition-all hover:bg-slate-50 hover:border-slate-200 cursor-pointer"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      task.status === "BLOCKED"
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {task.status === "BLOCKED" ? (
                      <AlertCircle className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Clock3 className="h-4 w-4" strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-slate-800">
                      {task.name}
                    </span>
                    <span className="block truncate text-[10px] font-semibold text-slate-400 mt-0.5">
                      {phaseName}
                      {overdue && task.dueDate ? ` · due ${formatAUDate(task.dueDate)}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Navigation Tabs (Apple Segmented Control Style) */}
      <div className="mb-6 flex justify-start">
        <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1.5 border border-slate-200/40">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
              activeTab === "tasks"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Phases & Tasks
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "contacts"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" strokeWidth={2} />
            Project Team
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              activeTab === "contacts" ? "bg-slate-100 text-slate-700" : "bg-slate-200/55 text-slate-500"
            }`}>
              {project.contacts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === "tasks" && activePhase && (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Phase Selector Sidebar / Mobile Scrollbar */}
          <aside className="surface-card border border-slate-100 h-fit p-3">
            <div className="px-3 pb-3 pt-2 border-b border-slate-100 mb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Project Phases</h2>
              <p className="mt-1 text-[11px] font-medium text-slate-400">Select a phase to view tasks</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 lg:flex-col lg:overflow-visible scrollbar-thin">
              {phaseStats.map(({ phase, total, done, blocked, overdue, progress: phaseProgress }) => {
                const selected = phase.order === activePhase.phase.order;
                return (
                  <button
                    key={phase.id}
                    onClick={() => setSelectedPhase(phase.order)}
                    className={`min-w-[210px] rounded-xl p-3 text-left transition-all duration-200 border cursor-pointer shrink-0 lg:shrink lg:min-w-0 ${
                      selected 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]" 
                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="mb-2.5 flex items-start justify-between gap-3">
                      <span className="text-xs font-bold leading-tight font-display">{phase.name}</span>
                      <span className={`text-[10px] font-bold tabular-nums shrink-0 ${selected ? "text-slate-300" : "text-slate-400"}`}>
                        {done}/{total}
                      </span>
                    </div>
                    <div className={`h-1.5 overflow-hidden rounded-full ${selected ? "bg-white/20" : "bg-slate-100"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${selected ? "bg-white" : PHASE_BAR_COLORS[phase.order]}`}
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>
                    {(blocked > 0 || overdue > 0) && (
                      <p className={`mt-2.5 text-[10px] font-bold ${selected ? "text-red-300" : "text-red-600"}`}>
                        {blocked > 0 ? `${blocked} blocked` : ""}
                        {blocked > 0 && overdue > 0 ? " · " : ""}
                        {overdue > 0 ? `${overdue} overdue` : ""}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Active Phase Tasks Section */}
          <PhaseSection
            phase={activePhase.phase as never}
            phaseIndex={activePhase.phase.order}
            projectId={project.id}
            contacts={project.contacts}
          />
        </div>
      )}

      {activeTab === "contacts" && (
        <ContactsPanel contacts={project.contacts} projectId={project.id} />
      )}

      <ProjectSettingsModal
        project={project}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

function ProjectMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "error" | "warning";
}) {
  const color =
    tone === "error" ? "text-red-600 bg-red-50 border-red-100" : tone === "warning" ? "text-amber-700 bg-amber-50 border-amber-100" : "text-slate-700 bg-slate-50 border-slate-200/50";
  return (
    <div className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border ${color} min-w-[54px]`}>
      <p className="text-sm font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}
