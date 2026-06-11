"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PRIORITY_CONFIG, STATUS_CONFIG, getStatusCycle } from "@/lib/utils";
import { formatAUDate, formatDuration, isOverdue } from "@/lib/dates";
import { Avatar } from "@/components/ui/Avatar";
import { addComment, createTask, deleteTask, updateTask } from "@/actions/tasks";
import { TaskEditModal } from "./TaskEditModal";
import { TaskForm } from "./TaskForm";

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
  subtasks: Omit<Task, "subtasks" | "comments">[];
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

interface TaskRowProps {
  task: Task;
  projectId: string;
  contacts: Contact[];
  phaseId: string;
}

export function TaskRow({ task, projectId, contacts, phaseId }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();

  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const overdue = isOverdue(task.dueDate, task.status);
  const assigneeInitials =
    task.assignee?.initials ??
    (task.assigneeText
      ? task.assigneeText
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : null);
  const assigneeName = task.assignee?.name ?? task.assigneeText ?? "";

  function cycleStatus() {
    const nextStatus = getStatusCycle(task.status);
    startTransition(() => updateTask(task.id, projectId, { status: nextStatus }));
  }

  function handleDelete() {
    if (!confirm(`Delete "${task.name}"?`)) return;
    startTransition(() => deleteTask(task.id, projectId));
  }

  function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    if (!commentText.trim()) return;
    startTransition(async () => {
      await addComment(task.id, projectId, commentText.trim());
      setCommentText("");
    });
  }

  function handleAddSubtask(data: Parameters<typeof createTask>[0]) {
    startTransition(async () => {
      await createTask({
        ...data,
        phaseId,
        projectId,
        parentId: task.id,
      });
      setShowAddSubtask(false);
    });
  }

  return (
    <div className={`border-b border-slate-100 last:border-0 ${isPending ? "opacity-60" : ""}`}>
      {/* Row Header */}
      <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50/50 md:grid-cols-[minmax(0,1fr)_120px_120px_100px]">
        <button
          onClick={() => setExpanded((value) => !value)}
          className="flex min-w-0 items-center gap-3 text-left cursor-pointer group/title"
          aria-expanded={expanded}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 transition-all group-hover/title:bg-slate-100 group-hover/title:text-slate-800">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-250 ${expanded ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </span>
          <span className="min-w-0">
            <span
              className={`block text-[13px] font-semibold tracking-tight transition-colors group-hover/title:text-blue-600 ${
                task.status === "DONE" ? "text-slate-400 line-through font-normal" : "text-slate-900"
              }`}
            >
              {task.name}
            </span>
            <span className="mt-0.5 block text-[10px] font-bold text-slate-400 md:hidden uppercase tracking-wider">
              {assigneeName || "Unassigned"} · {formatAUDate(task.dueDate)}
            </span>
          </span>
        </button>

        {/* Assignee */}
        <div className="hidden items-center gap-2 md:flex min-w-0">
          {assigneeInitials ? (
            <>
              <Avatar initials={assigneeInitials} title={assigneeName} size="xs" />
              <span className="truncate text-xs font-semibold text-slate-600">{assigneeName}</span>
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-400">Unassigned</span>
          )}
        </div>

        {/* Due Date */}
        <div className="hidden md:block">
          <p className={`text-xs font-bold tabular-nums ${overdue ? "text-red-600" : "text-slate-600"}`}>
            {formatAUDate(task.dueDate)}
          </p>
          {overdue && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Overdue</p>}
        </div>

        {/* Status Pill */}
        <button
          onClick={cycleStatus}
          className={`justify-self-end rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-85 md:justify-self-start cursor-pointer select-none ${statusConfig.className}`}
          title="Change status"
        >
          {statusConfig.label}
        </button>
      </div>

      {/* Expanded details container with Framer Motion slideDown */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-slate-50/35 border-t border-slate-100"
          >
            <div className="px-6 py-6 border-b border-slate-100">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Description</h4>
                  {task.description ? (
                    <p className="max-w-2xl whitespace-pre-wrap text-[13px] leading-relaxed text-slate-600">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-slate-400 italic">No description added.</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 cursor-pointer active:scale-[0.98]"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-500" strokeWidth={2} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition-all hover:bg-red-100 cursor-pointer active:scale-[0.98]"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Task Metadata Cards */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <TaskMeta
                  icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />}
                  label="Start"
                  value={formatAUDate(task.startDate)}
                />
                <TaskMeta
                  icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />}
                  label="Due"
                  value={formatAUDate(task.dueDate)}
                  alert={overdue}
                />
                <TaskMeta
                  icon={<Clock3 className="h-3.5 w-3.5" strokeWidth={2} />}
                  label="Duration"
                  value={task.duration ? formatDuration(task.duration) : "Not set"}
                />
                <TaskMeta
                  label="Priority"
                  value={priorityConfig.label}
                  valueClassName={priorityConfig.className}
                />
              </div>

              {/* Subtasks and Notes Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Subtasks Container */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Subtasks</h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {task.subtasks.filter((subtask) => subtask.status === "DONE").length}/{task.subtasks.length}
                      </span>
                    </div>
                    {task.subtasks.length > 0 && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm divide-y divide-slate-100">
                        {task.subtasks.map((subtask) => (
                          <SubtaskRow
                            key={subtask.id}
                            subtask={subtask}
                            projectId={projectId}
                            contacts={contacts}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {showAddSubtask ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                      <TaskForm
                        contacts={contacts}
                        onSubmit={handleAddSubtask as never}
                        onCancel={() => setShowAddSubtask(false)}
                        loading={isPending}
                        compact
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddSubtask(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors mt-1 cursor-pointer self-start"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      Add Subtask
                    </button>
                  )}
                </div>

                {/* Notes/Comments Container */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="mb-3 text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Activity Notes</h4>
                    {task.comments.length > 0 && (
                      <div className="mb-4 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {task.comments.map((comment) => (
                          <div key={comment.id} className="rounded-xl bg-white border border-slate-100/80 p-3 shadow-sm text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-700">System Log</span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {new Date(comment.createdAt).toLocaleDateString("en-AU")}
                              </span>
                            </div>
                            <span className="text-slate-600 font-medium leading-relaxed">{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Add a progress note..."
                      className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="h-9 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-35 cursor-pointer"
                    >
                      Save
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editOpen && (
        <TaskEditModal
          task={task}
          projectId={projectId}
          contacts={contacts}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function TaskMeta({
  icon,
  label,
  value,
  alert,
  valueClassName,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm">
      <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </p>
      <p className={`text-xs font-bold ${alert ? "text-red-600" : valueClassName ?? "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}

function SubtaskRow({
  subtask,
  projectId,
  contacts,
}: {
  subtask: Omit<Task, "subtasks" | "comments">;
  projectId: string;
  contacts: Contact[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const statusConfig = STATUS_CONFIG[subtask.status as keyof typeof STATUS_CONFIG];
  const overdue = isOverdue(subtask.dueDate, subtask.status);

  function cycleStatus() {
    startTransition(() =>
      updateTask(subtask.id, projectId, { status: getStatusCycle(subtask.status) })
    );
  }

  function handleDelete() {
    if (!confirm(`Delete "${subtask.name}"?`)) return;
    startTransition(() => deleteTask(subtask.id, projectId));
  }

  return (
    <div className={`group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 last:border-0 ${isPending ? "opacity-60" : ""}`}>
      <button
        onClick={cycleStatus}
        className={`h-4 w-4 shrink-0 rounded border cursor-pointer transition-colors ${
          subtask.status === "DONE" ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white hover:border-slate-400"
        }`}
        aria-label={`Change status for ${subtask.name}`}
      />
      <span className={`min-w-0 flex-1 truncate text-xs font-semibold ${subtask.status === "DONE" ? "text-slate-400 line-through font-normal" : "text-slate-800"}`}>
        {subtask.name}
      </span>
      <span className={`text-[10px] font-bold tabular-nums shrink-0 ${overdue ? "text-red-500" : "text-slate-400"}`}>
        {formatAUDate(subtask.dueDate)}
      </span>
      <span className={`hidden rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline-flex shrink-0 ${statusConfig.className}`}>
        {statusConfig.label}
      </span>
      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditOpen(true)} className="text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Edit subtask">
          <Pencil className="h-3 w-3" strokeWidth={2} />
        </button>
        <button onClick={handleDelete} className="text-red-400 hover:text-red-600 cursor-pointer" aria-label="Delete subtask">
          <Trash2 className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
      {editOpen && (
        <TaskEditModal
          task={{ ...subtask, subtasks: [], comments: [] }}
          projectId={projectId}
          contacts={contacts}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
