"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { PHASE_BAR_COLORS, PHASE_COLORS } from "@/lib/utils";
import { TaskRow } from "./TaskRow";
import { TaskForm } from "./TaskForm";
import { createTask } from "@/actions/tasks";
import { Button } from "@/components/ui/Button";

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
    <section className="surface-card border border-slate-200 min-w-0 overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center bg-slate-50/30">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`border-l-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colorClasses}`}>
              Phase {phaseIndex + 1}
            </span>
            {blocked > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                {blocked} blocked
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold tracking-[-.03em] text-slate-900">{phase.name}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">{done} of {total} tasks complete</p>
        </div>
        
        <div className="flex items-center gap-5 shrink-0">
          <div className="w-32 hidden xs:block">
            <div className="mb-1.5 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Progress</span>
              <span className="text-slate-700">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-slate-100">
              <div className={`h-full ${barColor}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddTask(true)}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Add Task
          </Button>
        </div>
      </div>

      {blocked > 0 && (
        <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" strokeWidth={2} />
          <span>
            <strong className="font-bold">Blocked: </strong>
            {phase.tasks
              .filter((task) => task.status === "BLOCKED")
              .map((task) => task.name)
              .join(", ")}{" "}
            {blocked === 1 ? "is" : "are"} currently blocked.
          </span>
        </div>
      )}

      {showAddTask && (
        <div className="border-b border-slate-150 p-6 bg-slate-50/20">
          <TaskForm
            contacts={contacts}
            onSubmit={handleAddTask}
            onCancel={() => setShowAddTask(false)}
            loading={isPending}
          />
        </div>
      )}

      {phase.tasks.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-bold text-slate-700">No tasks in this phase</p>
          <p className="mt-1 text-xs text-slate-400">Add the first task to begin tracking the work.</p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_120px_120px_100px] gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid">
            <span>Task</span>
            <span>Owner</span>
            <span>Due Date</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-slate-100">
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
