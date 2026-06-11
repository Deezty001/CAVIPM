"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Plus, AlertCircle } from "lucide-react";
import { PHASE_COLORS, PHASE_BAR_COLORS } from "@/lib/utils";
import { TaskRow } from "./TaskRow";
import { TaskForm } from "./TaskForm";
import { createTask } from "@/actions/tasks";

type Phase = {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  assigneeId: string | null;
  assigneeText: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  duration: number | null;
  status: string;
  priority: string;
  order: number;
  phaseId: string;
  subtasks: Task[];
  comments: { id: string; content: string; createdAt: Date }[];
  assignee: { name: string; initials: string } | null;
};

type Contact = {
  id: string;
  name: string;
  initials: string;
  title: string | null;
  organisation: string | null;
};

interface PhaseSectionProps {
  phase: Phase;
  phaseIndex: number;
  projectId: string;
  contacts: Contact[];
  expanded: boolean;
  onToggle: () => void;
}

export function PhaseSection({
  phase,
  phaseIndex,
  projectId,
  contacts,
  expanded,
  onToggle,
}: PhaseSectionProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allTasks = [...phase.tasks, ...phase.tasks.flatMap((t) => t.subtasks)];
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.status === "DONE").length;
  const blocked = allTasks.filter((t) => t.status === "BLOCKED").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const colorClasses = PHASE_COLORS[phaseIndex] ?? PHASE_COLORS[0];
  const barColor = PHASE_BAR_COLORS[phaseIndex] ?? PHASE_BAR_COLORS[0];

  function handleAddTask(data: {
    name: string;
    description?: string;
    assigneeId?: string;
    assigneeText?: string;
    startDate?: Date;
    dueDate?: Date;
    duration?: number;
    status?: string;
    priority?: string;
  }) {
    startTransition(async () => {
      await createTask({ ...data, phaseId: phase.id, projectId });
      setShowAddTask(false);
    });
  }

  return (
    <section
      id={`phase-${phaseIndex}`}
      className="surface-card overflow-hidden"
    >
      {/* Phase header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-[#f5f5f3]"
      >
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClasses}`}
          >
            {phase.name}
          </span>
          {blocked > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {blocked} blocked
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="w-24 h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--bg-muted)" }}
            >
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className="text-xs tabular-nums w-7 text-right"
              style={{ color: "var(--text-muted)" }}
            >
              {pct}%
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {done}/{total}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </button>

      {/* Blocked banner */}
      {expanded && blocked > 0 && (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-[10px] bg-[#f7ebeb] px-3 py-2 text-xs text-[#a03535]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {phase.tasks
              .filter((t) => t.status === "BLOCKED")
              .map((t) => t.name)
              .join(", ")}{" "}
            {blocked === 1 ? "is" : "are"} blocked
          </span>
        </div>
      )}

      {expanded && (
        <div>
          {/* Task table header */}
          {phase.tasks.length > 0 && (
            <div
              className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_100px_100px_80px_80px_60px] gap-2 px-4 py-2 text-xs font-medium border-b"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--divider)",
                background: "var(--bg-subtle)",
              }}
            >
              <span>Task</span>
              <span>Assignee</span>
              <span>Start</span>
              <span>Due</span>
              <span>Duration</span>
              <span>Status</span>
              <span>Priority</span>
            </div>
          )}

          {/* Tasks */}
          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {phase.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                projectId={projectId}
                contacts={contacts}
                phaseId={phase.id}
              />
            ))}
          </div>

          {/* Add task */}
          <div className="border-t px-5 py-3" style={{ borderColor: "var(--divider)" }}>
            {showAddTask ? (
              <TaskForm
                contacts={contacts}
                onSubmit={handleAddTask}
                onCancel={() => setShowAddTask(false)}
                loading={isPending}
              />
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                style={{ color: "var(--text-link)" }}
              >
                <Plus className="w-4 h-4" />
                Add task
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
