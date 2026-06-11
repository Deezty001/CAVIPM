"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  getStatusCycle,
} from "@/lib/utils";
import { formatAUDate, formatDuration, isOverdue } from "@/lib/dates";
import { Avatar } from "@/components/ui/Avatar";
import { updateTask, deleteTask, addComment } from "@/actions/tasks";
import { TaskEditModal } from "./TaskEditModal";
import { TaskForm } from "./TaskForm";
import { createTask } from "@/actions/tasks";

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
  isSubtask?: boolean;
}

export function TaskRow({
  task,
  projectId,
  contacts,
  phaseId,
  isSubtask = false,
}: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [hover, setHover] = useState(false);

  const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
  const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const overdue = isOverdue(task.dueDate, task.status);
  const assigneeDisplay =
    task.assignee?.initials ??
    (task.assigneeText
      ? task.assigneeText
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : null);

  function cycleStatus() {
    const next = getStatusCycle(task.status);
    startTransition(() => updateTask(task.id, projectId, { status: next }));
  }

  function handleDelete() {
    if (!confirm(`Delete "${task.name}"?`)) return;
    startTransition(() => deleteTask(task.id, projectId));
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
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
    <div
      className={`${isSubtask ? "pl-6 bg-gray-50/30" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_120px_100px_100px_80px_80px_60px] items-center gap-2 px-4 py-2.5 transition-colors ${
          hover ? "bg-gray-50/80" : ""
        } ${isPending ? "opacity-60" : ""}`}
      >
        {/* Name + expand */}
        <div className="flex items-center gap-2 min-w-0">
          {!isSubtask && task.subtasks.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 w-4 h-4 flex items-center justify-center"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                style={{ color: "var(--text-muted)" }}
              />
            </button>
          )}
          {!isSubtask && task.subtasks.length === 0 && (
            <span className="w-4 shrink-0" />
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-sm text-left truncate transition-colors hover:opacity-70 ${
              task.status === "DONE" ? "line-through opacity-50" : ""
            }`}
            style={{ color: "var(--text-primary)" }}
          >
            {task.name}
          </button>
          {hover && (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                onClick={() => setEditOpen(true)}
                className="w-5 h-5 flex items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Edit task"
              >
                <Pencil className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
              </button>
              <button
                onClick={handleDelete}
                className="w-5 h-5 flex items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Delete task"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="hidden md:flex items-center">
          {assigneeDisplay ? (
            <Avatar
              initials={assigneeDisplay}
              title={task.assignee?.name ?? task.assigneeText ?? ""}
              size="sm"
            />
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              —
            </span>
          )}
        </div>

        {/* Start */}
        <div
          className="hidden md:block text-xs tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {formatAUDate(task.startDate)}
        </div>

        {/* Due */}
        <div
          className={`hidden md:block text-xs tabular-nums font-medium ${
            overdue ? "text-red-500" : ""
          }`}
          style={overdue ? undefined : { color: "var(--text-secondary)" }}
        >
          {formatAUDate(task.dueDate)}
        </div>

        {/* Duration */}
        <div
          className="hidden md:block text-xs tabular-nums"
          title={task.duration ? `${task.duration} business days` : ""}
          style={{ color: "var(--text-muted)" }}
        >
          {task.duration ? formatDuration(task.duration) : "—"}
        </div>

        {/* Status */}
        <div className="hidden md:flex">
          <button
            onClick={cycleStatus}
            className={`text-xs px-2 py-0.5 rounded-md border font-medium transition-all hover:opacity-80 ${statusCfg.className}`}
            title="Click to cycle status"
          >
            {statusCfg.label}
          </button>
        </div>

        {/* Priority */}
        <div className={`hidden md:block text-xs font-medium ${priorityCfg.className}`}>
          {priorityCfg.label}
        </div>

        {/* Mobile row — right side */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={cycleStatus}
            className={`text-xs px-2 py-0.5 rounded-md border font-medium ${statusCfg.className}`}
          >
            {statusCfg.label}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          className="border-t px-4 py-3"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-muted)",
          }}
        >
          {task.description && (
            <p
              className="text-sm mb-3 whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {task.description}
            </p>
          )}

          {/* Subtasks */}
          {!isSubtask && (
            <div className="mb-3">
              {task.subtasks.length > 0 && (
                <div>
                  <p
                    className="text-xs font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Subtasks ({task.subtasks.filter((s) => s.status === "DONE").length}/
                    {task.subtasks.length})
                  </p>
                  <div
                    className="rounded-lg border divide-y"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg-surface)",
                    }}
                  >
                    {task.subtasks.map((subtask) => (
                      <SubtaskRow
                        key={subtask.id}
                        subtask={subtask}
                        projectId={projectId}
                        contacts={contacts}
                      />
                    ))}
                  </div>
                </div>
              )}
              {showAddSubtask ? (
                <div className="mt-2">
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
                  className="mt-2 flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add subtask
                </button>
              )}
            </div>
          )}

          {/* Comments */}
          <div>
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Notes
            </p>
            {task.comments.length > 0 && (
              <div className="space-y-2 mb-2">
                {task.comments.map((c) => (
                  <div key={c.id} className="text-xs">
                    <span
                      className="font-medium mr-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(c.createdAt).toLocaleDateString("en-AU")}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>{c.content}</span>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a note…"
                className="flex-1 text-xs px-2.5 py-1.5 rounded-md border"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="text-xs px-2.5 py-1.5 rounded-md text-white transition-opacity disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Subtasks (in expanded view of parent) */}
      {!isSubtask && expanded && task.subtasks.length === 0 && null}

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
  const statusCfg = STATUS_CONFIG[subtask.status as keyof typeof STATUS_CONFIG];
  const overdue = isOverdue(subtask.dueDate, subtask.status);
  const assigneeDisplay =
    subtask.assignee?.initials ??
    (subtask.assigneeText
      ? subtask.assigneeText.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
      : null);

  function cycleStatus() {
    const next = getStatusCycle(subtask.status);
    startTransition(() => updateTask(subtask.id, projectId, { status: next }));
  }

  function handleDelete() {
    if (!confirm(`Delete "${subtask.name}"?`)) return;
    startTransition(() => deleteTask(subtask.id, projectId));
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 group ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <span
        className={`text-xs flex-1 truncate ${subtask.status === "DONE" ? "line-through opacity-50" : ""}`}
        style={{ color: "var(--text-primary)" }}
      >
        {subtask.name}
      </span>
      <div className="flex items-center gap-2">
        {assigneeDisplay && (
          <Avatar
            initials={assigneeDisplay}
            size="xs"
            title={subtask.assignee?.name ?? subtask.assigneeText ?? ""}
          />
        )}
        <span
          className={`text-xs tabular-nums ${overdue ? "text-red-500 font-medium" : ""}`}
          style={overdue ? undefined : { color: "var(--text-muted)" }}
        >
          {formatAUDate(subtask.dueDate)}
        </span>
        <button
          onClick={cycleStatus}
          className={`text-xs px-1.5 py-0.5 rounded border font-medium ${statusCfg.className}`}
        >
          {statusCfg.label}
        </button>
        <button
          onClick={() => setEditOpen(true)}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
          aria-label="Edit subtask"
        >
          <Pencil className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        </button>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
          aria-label="Delete subtask"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
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
