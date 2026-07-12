"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

async function getSingleUserContext() {
  const email = process.env.DEFAULT_USER_EMAIL ?? "workspace@caviproperty.local";
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { name: "My Workspace", email, initials: "ME" },
  });
  const workspace = await db.workspace.upsert({
    where: { slug: "cavi-property" },
    update: {},
    create: { name: "Cavi Property", slug: "cavi-property" },
  });
  await db.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    update: { role: "OWNER" },
    create: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
  });
  await db.project.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
  return { user, workspace };
}

export async function getMyWork() {
  const { user, workspace } = await getSingleUserContext();
  const [projectTasks, personalActions] = await Promise.all([
    db.task.findMany({
      where: { phase: { project: { workspaceId: workspace.id } }, status: { not: "CANCELLED" } },
      include: { phase: { include: { project: { select: { id: true, name: true } } } } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    }),
    db.personalAction.findMany({
      where: { ownerId: user.id, status: { not: "CANCELLED" } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    }),
  ]);
  return { user, workspace, projectTasks, personalActions };
}

export async function createPersonalAction(data: { title: string; dueDate?: Date; plannedDate?: Date; priority?: string; estimateMinutes?: number; projectId?: string }) {
  const { user, workspace } = await getSingleUserContext();
  await db.personalAction.create({
    data: { title: data.title, dueDate: data.dueDate, plannedDate: data.plannedDate, priority: (data.priority as never) ?? "NORMAL", estimateMinutes: data.estimateMinutes, projectId: data.projectId || undefined, ownerId: user.id, workspaceId: workspace.id },
  });
  revalidatePath("/my-work");
}

export async function updatePersonalAction(id: string, data: { status?: string; plannedDate?: Date | null; dueDate?: Date | null; waitingOn?: string | null; followUpDate?: Date | null }) {
  await db.personalAction.update({ where: { id }, data: { ...data, status: data.status as never, completedAt: data.status === "DONE" ? new Date() : undefined } });
  revalidatePath("/my-work");
}

export async function updateWorkTask(id: string, projectId: string, data: { status?: string; plannedDate?: Date | null }) {
  await db.task.update({ where: { id }, data: { ...data, status: data.status as never, completedAt: data.status === "DONE" ? new Date() : undefined, lastActivityAt: new Date() } });
  revalidatePath("/my-work");
  revalidatePath(`/projects/${projectId}`);
}
