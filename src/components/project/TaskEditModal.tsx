"use client";

import { useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { TaskForm } from "./TaskForm";
import { updateTask } from "@/actions/tasks";

type Contact = {
  id: string;
  name: string;
  initials: string;
  title: string | null;
  organisation: string | null;
};

interface TaskEditModalProps {
  task: {
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
    subtasks: unknown[];
    comments: unknown[];
  };
  projectId: string;
  contacts: Contact[];
  open: boolean;
  onClose: () => void;
}

export function TaskEditModal({
  task,
  projectId,
  contacts,
  open,
  onClose,
}: TaskEditModalProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(data: {
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
      await updateTask(task.id, projectId, {
        name: data.name,
        description: data.description ?? null,
        assigneeId: data.assigneeId ?? null,
        assigneeText: data.assigneeText ?? undefined,
        startDate: data.startDate ?? null,
        dueDate: data.dueDate ?? null,
        duration: data.duration ?? null,
        status: data.status,
        priority: data.priority,
      });
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Task" size="lg">
      <TaskForm
        contacts={contacts}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={isPending}
        initialValues={{
          name: task.name,
          description: task.description ?? "",
          assigneeId: task.assigneeId ?? "",
          assigneeText: task.assigneeText ?? "",
          startDate: task.startDate ?? undefined,
          dueDate: task.dueDate ?? undefined,
          duration: task.duration ?? undefined,
          status: task.status,
          priority: task.priority,
        }}
      />
    </Modal>
  );
}
