"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { addBusinessDays, subtractBusinessDays, countBusinessDays } from "@/lib/dates";
import { isNSWPublicHoliday } from "@/lib/holidays";

type Contact = {
  id: string;
  name: string;
  initials: string;
  title: string | null;
  organisation: string | null;
};

type TaskFormData = {
  name: string;
  description?: string;
  assigneeId?: string;
  assigneeText?: string;
  startDate?: Date;
  dueDate?: Date;
  duration?: number;
  status?: string;
  priority?: string;
};

interface TaskFormProps {
  contacts: Contact[];
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  compact?: boolean;
  initialValues?: Partial<TaskFormData>;
}

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  { value: "BLOCKED", label: "Blocked" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

function toDateInput(d: Date | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function fromDateInput(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function TaskForm({
  contacts,
  onSubmit,
  onCancel,
  loading,
  compact,
  initialValues,
}: TaskFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(initialValues?.assigneeId ?? "");
  const [assigneeText, setAssigneeText] = useState(initialValues?.assigneeText ?? "");
  const [startDate, setStartDate] = useState(toDateInput(initialValues?.startDate));
  const [dueDate, setDueDate] = useState(toDateInput(initialValues?.dueDate));
  const [duration, setDuration] = useState(
    initialValues?.duration ? String(initialValues.duration) : ""
  );
  const [status, setStatus] = useState(initialValues?.status ?? "TODO");
  const [priority, setPriority] = useState(initialValues?.priority ?? "NORMAL");
  const [dueDateWarning, setDueDateWarning] = useState("");

  // Derive third field when two are set
  function handleStartChange(val: string) {
    setStartDate(val);
    if (val && duration) {
      const s = fromDateInput(val)!;
      const d = addBusinessDays(s, parseInt(duration));
      setDueDate(toDateInput(d));
      checkDueDateWarning(d);
    } else if (val && dueDate) {
      const s = fromDateInput(val)!;
      const e = fromDateInput(dueDate)!;
      setDuration(String(countBusinessDays(s, e)));
    }
  }

  function handleDueChange(val: string) {
    setDueDate(val);
    if (val) checkDueDateWarning(fromDateInput(val)!);
    if (val && startDate) {
      const s = fromDateInput(startDate)!;
      const e = fromDateInput(val)!;
      setDuration(String(countBusinessDays(s, e)));
    } else if (val && duration) {
      const e = fromDateInput(val)!;
      const s = subtractBusinessDays(e, parseInt(duration));
      setStartDate(toDateInput(s));
    }
  }

  function handleDurationChange(val: string) {
    setDuration(val);
    const n = parseInt(val);
    if (!isNaN(n) && n > 0 && startDate) {
      const s = fromDateInput(startDate)!;
      const d = addBusinessDays(s, n);
      setDueDate(toDateInput(d));
      checkDueDateWarning(d);
    } else if (!isNaN(n) && n > 0 && dueDate) {
      const e = fromDateInput(dueDate)!;
      const s = subtractBusinessDays(e, n);
      setStartDate(toDateInput(s));
    }
  }

  function checkDueDateWarning(d: Date) {
    const day = d.getDay();
    if (day === 0 || day === 6) {
      setDueDateWarning("Due date falls on a weekend — consider adjusting.");
    } else if (isNSWPublicHoliday(d)) {
      setDueDateWarning("Due date falls on a NSW public holiday — consider adjusting.");
    } else {
      setDueDateWarning("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      assigneeId: assigneeId || undefined,
      assigneeText: !assigneeId && assigneeText ? assigneeText.trim() : undefined,
      startDate: fromDateInput(startDate),
      dueDate: fromDateInput(dueDate),
      duration: duration ? parseInt(duration) : undefined,
      status,
      priority,
    });
  }

  const contactOptions = [
    { value: "", label: "No assignee" },
    ...contacts.map((c) => ({
      value: c.id,
      label: `${c.name}${c.title ? ` (${c.title})` : ""}`,
    })),
  ];

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subtask name"
            required
            autoFocus
            className="flex-1 text-sm px-2.5 py-1.5 rounded-md border"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleDueChange(e.target.value)}
            className="text-sm px-2 py-1.5 rounded-md border"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          />
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="grid grid-cols-1 gap-3">
        <Input
          label="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Submit Development Application"
          required
          autoFocus
        />
        {!compact && (
          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              className="px-3 py-2 text-sm rounded-lg border resize-none"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Select
          label="Assignee"
          options={contactOptions}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
        <Input
          label="Duration (bd)"
          type="number"
          min={1}
          placeholder="e.g. 5"
          value={duration}
          onChange={(e) => handleDurationChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => handleStartChange(e.target.value)}
        />
        <div>
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => handleDueChange(e.target.value)}
          />
          {dueDateWarning && (
            <p className="text-xs text-orange-500 mt-1">{dueDateWarning}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={loading || !name.trim()}>
          {loading ? "Saving…" : "Add Task"}
        </Button>
      </div>
    </form>
  );
}
