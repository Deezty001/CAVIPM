"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { PHASE_NAMES } from "@/lib/utils";
import { DEFAULT_TEMPLATE } from "@/lib/template";
import { addBusinessDays } from "@/lib/dates";

export async function getProjects() {
  return db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      phases: {
        include: {
          tasks: {
            where: { parentId: null },
            include: { subtasks: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getProject(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      phases: {
        include: {
          tasks: {
            where: { parentId: null },
            include: {
              subtasks: {
                include: { assignee: true },
                orderBy: { order: "asc" },
              },
              assignee: true,
              comments: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      contacts: { orderBy: { name: "asc" } },
    },
  });
}

export async function createProject(data: {
  name: string;
  address: string;
  suburb: string;
  type: string;
  lotCount?: number;
  useTemplate?: boolean;
}) {
  const project = await db.project.create({
    data: {
      name: data.name,
      address: data.address,
      suburb: data.suburb,
      type: data.type as never,
      lotCount: data.lotCount,
      phases: {
        create: PHASE_NAMES.map((name, i) => ({ name, order: i })),
      },
    },
    include: { phases: true },
  });

  if (data.useTemplate) {
    const phaseMap = project.phases.reduce<Record<number, string>>((acc, p) => {
      acc[p.order] = p.id;
      return acc;
    }, {});

    const tasksByPhase = DEFAULT_TEMPLATE.reduce<Record<number, typeof DEFAULT_TEMPLATE>>((acc, t) => {
      if (!acc[t.phase]) acc[t.phase] = [];
      acc[t.phase].push(t);
      return acc;
    }, {});

    for (const [phaseIdx, tasks] of Object.entries(tasksByPhase)) {
      const phaseId = phaseMap[Number(phaseIdx)];
      if (!phaseId) continue;
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        const start = new Date();
        const due = addBusinessDays(start, t.duration);
        await db.task.create({
          data: {
            name: t.name,
            description: t.description,
            assigneeText: t.assigneeRole,
            duration: t.duration,
            startDate: start,
            dueDate: due,
            phaseId,
            order: i,
          },
        });
      }
    }
  }

  revalidatePath("/");
  return project;
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    address: string;
    suburb: string;
    type: string;
    lotCount: number;
    status: string;
  }>
) {
  await db.project.update({ where: { id }, data: data as never });
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  await db.project.delete({ where: { id } });
  revalidatePath("/");
}
