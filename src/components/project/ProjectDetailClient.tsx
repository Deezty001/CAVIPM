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
    <div className="app-page max-w-[1240px]">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-[#6b6b6b] transition-colors hover:text-[#111111]"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Projects
      </Link>

      <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <h1 className="page-title truncate">{project.name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                project.status === "ACTIVE"
                  ? "bg-[#ebf5ee] text-[#3d7a55]"
                  : project.status === "ON_HOLD"
                    ? "bg-[#f7f0e5] text-[#96702a]"
                    : "bg-[#f0f0ee] text-[#6b6b6b]"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-[13px] text-[#6b6b6b]">
            {[project.address, project.suburb].filter(Boolean).join(", ")}
            {project.lotCount ? ` · ${project.lotCount} lots` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${project.id}/gantt`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e0e0de] bg-white px-4 text-xs font-medium transition-colors hover:border-[#bebebe] hover:bg-[#f5f5f3]"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.5} />
            Gantt
          </Link>
          <Link
            href={`/projects/${project.id}/meetings`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e0e0de] bg-white px-4 text-xs font-medium transition-colors hover:border-[#bebebe] hover:bg-[#f5f5f3]"
          >
            <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
            Meetings
          </Link>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6b6b6b] shadow-[var(--shadow-card)] transition-colors hover:bg-[#f0f0ee] hover:text-[#111111]"
            aria-label="Project settings"
          >
            <Settings className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-medium text-[#6b6b6b]">Project progress</p>
              <p className="text-[32px] font-bold leading-none tracking-[-0.5px]">{progress}%</p>
            </div>
            <div className="grid grid-cols-3 gap-5 text-right">
              <ProjectMetric label="Complete" value={doneTasks} />
              <ProjectMetric label="Blocked" value={blockedTasks} tone="error" />
              <ProjectMetric label="Overdue" value={overdueTasks} tone="warning" />
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#ebebeb]">
            <div
              className="h-full rounded-full bg-[#4a6fa5] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-[#6b6b6b]">
            <span>{doneTasks} of {totalTasks} tasks complete</span>
            <span>{orderedPhases.length} phases</span>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Needs attention</h2>
              <p className="mt-1 text-xs text-[#6b6b6b]">Blocked and overdue work</p>
            </div>
            {attentionItems.length > 0 && (
              <span className="rounded-full bg-[#f7ebeb] px-2 py-1 text-[11px] font-medium text-[#a03535]">
                {attentionItems.length}
              </span>
            )}
          </div>
          {attentionItems.length === 0 ? (
            <div className="flex items-center gap-3 rounded-[10px] bg-[#ebf5ee] px-4 py-3 text-[#3d7a55]">
              <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <p className="text-xs font-medium">Nothing currently needs attention.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {attentionItems.map(({ task, phaseName, overdue }) => (
                <button
                  key={task.id}
                  onClick={() => {
                    const phase = orderedPhases.find((item) => item.name === phaseName);
                    if (phase) setSelectedPhase(phase.order);
                    setActiveTab("tasks");
                  }}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-[#f5f5f3]"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      task.status === "BLOCKED"
                        ? "bg-[#f7ebeb] text-[#a03535]"
                        : "bg-[#f7f0e5] text-[#96702a]"
                    }`}
                  >
                    {task.status === "BLOCKED" ? (
                      <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Clock3 className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[#111111]">
                      {task.name}
                    </span>
                    <span className="block truncate text-[11px] text-[#6b6b6b]">
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

      <div className="mb-5 flex items-center gap-1 border-b border-[#e0e0de]">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`border-b-2 px-1 pb-3 text-[13px] font-medium transition-colors ${
            activeTab === "tasks"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#6b6b6b] hover:text-[#111111]"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`ml-5 flex items-center gap-1.5 border-b-2 px-1 pb-3 text-[13px] font-medium transition-colors ${
            activeTab === "contacts"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#6b6b6b] hover:text-[#111111]"
          }`}
        >
          <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
          Team
          <span className="text-[11px] text-[#a0a0a0]">{project.contacts.length}</span>
        </button>
      </div>

      {activeTab === "tasks" && activePhase && (
        <div className="grid gap-4 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="surface-card h-fit p-2">
            <div className="px-3 pb-2 pt-2">
              <h2 className="text-sm font-semibold">Phases</h2>
              <p className="mt-0.5 text-[11px] text-[#6b6b6b]">Choose one to work in</p>
            </div>
            <div className="mt-1 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {phaseStats.map(({ phase, total, done, blocked, overdue, progress: phaseProgress }) => {
                const selected = phase.order === activePhase.phase.order;
                return (
                  <button
                    key={phase.id}
                    onClick={() => setSelectedPhase(phase.order)}
                    className={`min-w-[205px] rounded-[10px] p-3 text-left transition-colors lg:min-w-0 ${
                      selected ? "bg-[#111111] text-white" : "hover:bg-[#f5f5f3]"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <span className="text-xs font-semibold leading-snug">{phase.name}</span>
                      <span className={`text-[11px] ${selected ? "text-white/65" : "text-[#a0a0a0]"}`}>
                        {done}/{total}
                      </span>
                    </div>
                    <div className={`h-1 overflow-hidden rounded-full ${selected ? "bg-white/20" : "bg-[#ebebeb]"}`}>
                      <div
                        className={`h-full rounded-full ${selected ? "bg-white" : PHASE_BAR_COLORS[phase.order]}`}
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>
                    {(blocked > 0 || overdue > 0) && (
                      <p className={`mt-2 text-[11px] ${selected ? "text-white/70" : "text-[#a03535]"}`}>
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
    tone === "error" ? "text-[#a03535]" : tone === "warning" ? "text-[#96702a]" : "text-[#111111]";
  return (
    <div>
      <p className={`text-lg font-semibold leading-none tabular-nums ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] text-[#6b6b6b]">{label}</p>
    </div>
  );
}
