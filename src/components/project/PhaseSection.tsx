"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { PHASE_BAR_COLORS, PHASE_COLORS } from "@/lib/utils";
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
}

export function PhaseSection({
  phase,
  phaseIndex,
  projectId,
  contacts,
}: PhaseSectionProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allTasks = [...phase.tasks, ...phase.tasks.flatMap((task) => task.subtasks)];
  const total = allTasks.length;
  const done = allTasks.filter((task) => task.status === "DONE").length;
  const blocked = allTasks.filter((task) => task.status === "BLOCKED").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
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
    <section className="surface-card min-w-0 overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-[#f0f0ee] px-5 py-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${colorClasses}`}>
              Phase {phaseIndex + 1}
            </span>
            {blocked > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#a03535]">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                {blocked} blocked
              </span>
            )}
          </div>
          <h2 className="text-[18px] font-bold tracking-[-0.2px]">{phase.name}</h2>
          <p className="mt-1 text-xs text-[#6b6b6b]">{done} of {total} tasks complete</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-28">
            <div className="mb-1.5 flex justify-between text-[11px] text-[#6b6b6b]">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#ebebeb]">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#111111] px-4 text-xs font-medium text-white transition-opacity hover:opacity-80"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Add task
          </button>
        </div>
      </div>

      {blocked > 0 && (
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-[10px] bg-[#f7ebeb] px-3 py-2.5 text-xs text-[#a03535]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>
            {phase.tasks
              .filter((task) => task.status === "BLOCKED")
              .map((task) => task.name)
              .join(", ")}{" "}
            {blocked === 1 ? "is" : "are"} blocked.
          </span>
        </div>
      )}

      {showAddTask && (
        <div className="border-b border-[#f0f0ee] p-5">
          <TaskForm
            contacts={contacts}
            onSubmit={handleAddTask}
            onCancel={() => setShowAddTask(false)}
            loading={isPending}
          />
        </div>
      )}

      {phase.tasks.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium">No tasks in this phase</p>
          <p className="mt-1 text-xs text-[#6b6b6b]">Add the first task when this phase is ready.</p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_120px_100px] gap-3 border-b border-[#f0f0ee] bg-[#fafaf9] px-5 py-2.5 text-[11px] font-medium text-[#6b6b6b] md:grid">
            <span>Task</span>
            <span>Owner</span>
            <span>Due</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-[#f0f0ee]">
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
        </>
      )}
    </section>
  );
}
