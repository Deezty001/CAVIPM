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
    <div className={isPending ? "opacity-60" : ""}>
      <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-[#fafaf9] md:grid-cols-[minmax(0,1fr)_110px_120px_100px]">
        <button
          onClick={() => setExpanded((value) => !value)}
          className="flex min-w-0 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#a0a0a0] transition-colors group-hover:bg-[#f0f0ee] group-hover:text-[#111111]">
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              strokeWidth={1.5}
            />
          </span>
          <span className="min-w-0">
            <span
              className={`block truncate text-[13px] font-medium ${
                task.status === "DONE" ? "text-[#a0a0a0] line-through" : "text-[#111111]"
              }`}
            >
              {task.name}
            </span>
            <span className="mt-0.5 block text-[11px] text-[#a0a0a0] md:hidden">
              {assigneeName || "Unassigned"} · {formatAUDate(task.dueDate)}
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {assigneeInitials ? (
            <>
              <Avatar initials={assigneeInitials} title={assigneeName} size="sm" />
              <span className="truncate text-[11px] text-[#6b6b6b]">{assigneeName}</span>
            </>
          ) : (
            <span className="text-[11px] text-[#a0a0a0]">Unassigned</span>
          )}
        </div>

        <div className="hidden md:block">
          <p className={`text-xs font-medium tabular-nums ${overdue ? "text-[#a03535]" : "text-[#6b6b6b]"}`}>
            {formatAUDate(task.dueDate)}
          </p>
          {overdue && <p className="text-[10px] font-medium text-[#a03535]">Overdue</p>}
        </div>

        <button
          onClick={cycleStatus}
          className={`justify-self-end rounded-full border px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-75 md:justify-self-start ${statusConfig.className}`}
          title="Change status"
        >
          {statusConfig.label}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#f0f0ee] bg-[#fafaf9] px-5 py-5">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              {task.description ? (
                <p className="max-w-2xl whitespace-pre-wrap text-[13px] leading-relaxed text-[#6b6b6b]">
                  {task.description}
                </p>
              ) : (
                <p className="text-xs text-[#a0a0a0]">No description added.</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e0e0de] bg-white px-3 text-xs font-medium transition-colors hover:border-[#bebebe]"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[#a03535] transition-colors hover:bg-[#f7ebeb]"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                Delete
              </button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TaskMeta
              icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Start"
              value={formatAUDate(task.startDate)}
            />
            <TaskMeta
              icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Due"
              value={formatAUDate(task.dueDate)}
              alert={overdue}
            />
            <TaskMeta
              icon={<Clock3 className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Duration"
              value={task.duration ? formatDuration(task.duration) : "Not set"}
            />
            <TaskMeta
              label="Priority"
              value={priorityConfig.label}
              valueClassName={priorityConfig.className}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold">Subtasks</h3>
                <span className="text-[11px] text-[#a0a0a0]">
                  {task.subtasks.filter((subtask) => subtask.status === "DONE").length}/{task.subtasks.length}
                </span>
              </div>
              {task.subtasks.length > 0 && (
                <div className="mb-2 overflow-hidden rounded-[10px] border border-[#e0e0de] bg-white">
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
              {showAddSubtask ? (
                <TaskForm
                  contacts={contacts}
                  onSubmit={handleAddSubtask as never}
                  onCancel={() => setShowAddSubtask(false)}
                  loading={isPending}
                  compact
                />
              ) : (
                <button
                  onClick={() => setShowAddSubtask(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#4a6fa5]"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Add subtask
                </button>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold">Notes</h3>
              {task.comments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="rounded-[8px] bg-white px-3 py-2 text-xs">
                      <span className="mr-2 text-[11px] font-medium text-[#a0a0a0]">
                        {new Date(comment.createdAt).toLocaleDateString("en-AU")}
                      </span>
                      <span className="text-[#6b6b6b]">{comment.content}</span>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Add a note"
                  className="h-9 min-w-0 flex-1 rounded-[10px] border border-[#e0e0de] bg-white px-3 text-xs outline-none focus:border-[#111111]"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="h-9 rounded-full bg-[#111111] px-4 text-xs font-medium text-white disabled:opacity-35"
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

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
    <div className="rounded-[10px] bg-white px-3 py-2.5">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-[#a0a0a0]">
        {icon}
        {label}
      </p>
      <p className={`text-xs font-medium ${alert ? "text-[#a03535]" : valueClassName ?? "text-[#111111]"}`}>
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
    <div className={`group flex items-center gap-3 border-b border-[#f0f0ee] px-3 py-2.5 last:border-0 ${isPending ? "opacity-60" : ""}`}>
      <button
        onClick={cycleStatus}
        className={`h-4 w-4 shrink-0 rounded-full border ${
          subtask.status === "DONE" ? "border-[#111111] bg-[#111111]" : "border-[#bebebe] bg-white"
        }`}
        aria-label={`Change status for ${subtask.name}`}
      />
      <span className={`min-w-0 flex-1 truncate text-xs ${subtask.status === "DONE" ? "text-[#a0a0a0] line-through" : "text-[#111111]"}`}>
        {subtask.name}
      </span>
      <span className={`text-[11px] ${overdue ? "font-medium text-[#a03535]" : "text-[#a0a0a0]"}`}>
        {formatAUDate(subtask.dueDate)}
      </span>
      <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${statusConfig.className}`}>
        {statusConfig.label}
      </span>
      <button onClick={() => setEditOpen(true)} className="text-[#a0a0a0] opacity-0 transition-opacity group-hover:opacity-100" aria-label="Edit subtask">
        <Pencil className="h-3 w-3" strokeWidth={1.5} />
      </button>
      <button onClick={handleDelete} className="text-[#a03535] opacity-0 transition-opacity group-hover:opacity-100" aria-label="Delete subtask">
        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
      </button>
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
