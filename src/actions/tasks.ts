"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createTask(data: {
  name: string;
  description?: string;
  assigneeId?: string;
  assigneeText?: string;
  startDate?: Date;
  dueDate?: Date;
  duration?: number;
  status?: string;
  priority?: string;
  phaseId: string;
  parentId?: string;
  projectId: string;
}) {
  const count = await db.task.count({
    where: { phaseId: data.phaseId, parentId: data.parentId ?? null },
  });
  const task = await db.task.create({
    data: {
      name: data.name,
      description: data.description,
      assigneeId: data.assigneeId,
      assigneeText: data.assigneeText,
      startDate: data.startDate,
      dueDate: data.dueDate,
      duration: data.duration,
      status: (data.status as never) ?? "TODO",
      priority: (data.priority as never) ?? "NORMAL",
      phaseId: data.phaseId,
      parentId: data.parentId,
      order: count,
    },
  });
  revalidatePath(`/projects/${data.projectId}`);
  return task;
}

export async function updateTask(
  id: string,
  projectId: string,
  data: Partial<{
    name: string;
    description: string | null;
    assigneeId: string | null;
    assigneeText: string;
    startDate: Date | null;
    dueDate: Date | null;
    duration: number | null;
    status: string;
    priority: string;
    order: number;
  }>
) {
  await db.task.update({ where: { id }, data: data as never });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/gantt`);
}

export async function deleteTask(id: string, projectId: string) {
  await db.task.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/gantt`);
}

export async function addComment(taskId: string, projectId: string, content: string) {
  await db.comment.create({ data: { taskId, content } });
  revalidatePath(`/projects/${projectId}`);
}

export async function reorderTasks(
  phaseId: string,
  projectId: string,
  taskIds: string[]
) {
  await Promise.all(
    taskIds.map((id, i) => db.task.update({ where: { id }, data: { order: i } }))
  );
  revalidatePath(`/projects/${projectId}`);
}
