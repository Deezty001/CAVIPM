"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function getMeetings(projectId: string) {
  return db.meeting.findMany({
    where: { projectId },
    include: {
      attendees: true,
      agendaItems: {
        include: { subItems: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getMeeting(id: string) {
  return db.meeting.findUnique({
    where: { id },
    include: {
      attendees: true,
      agendaItems: {
        include: { subItems: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      project: true,
    },
  });
}

export async function createMeeting(data: {
  projectId: string;
  type: string;
  date: Date;
  endTime?: Date;
  location?: string;
  preparedBy?: string;
  nextMeeting?: Date;
  attendees: { name: string; initials: string; title?: string; organisation?: string }[];
  agendaItems: {
    number: string;
    title?: string;
    order: number;
    subItems: { number: string; description: string; action?: string; owner?: string; order: number }[];
  }[];
}) {
  const meeting = await db.meeting.create({
    data: {
      projectId: data.projectId,
      type: data.type as never,
      date: data.date,
      endTime: data.endTime,
      location: data.location,
      preparedBy: data.preparedBy,
      nextMeeting: data.nextMeeting,
      attendees: { create: data.attendees },
      agendaItems: {
        create: data.agendaItems.map((item) => ({
          number: item.number,
          title: item.title,
          order: item.order,
          subItems: { create: item.subItems },
        })),
      },
    },
  });
  revalidatePath(`/projects/${data.projectId}/meetings`);
  return meeting;
}

export async function updateMeeting(
  id: string,
  projectId: string,
  data: {
    type?: string;
    date?: Date;
    endTime?: Date;
    location?: string;
    preparedBy?: string;
    nextMeeting?: Date;
    attendees?: { name: string; initials: string; title?: string; organisation?: string }[];
    agendaItems?: {
      number: string;
      title?: string;
      order: number;
      subItems: { number: string; description: string; action?: string; owner?: string; order: number }[];
    }[];
  }
) {
  // Delete and recreate attendees/agenda items for simplicity
  if (data.attendees !== undefined) {
    await db.meetingAttendee.deleteMany({ where: { meetingId: id } });
  }
  if (data.agendaItems !== undefined) {
    await db.agendaItem.deleteMany({ where: { meetingId: id } });
  }

  await db.meeting.update({
    where: { id },
    data: {
      type: data.type as never,
      date: data.date,
      endTime: data.endTime,
      location: data.location,
      preparedBy: data.preparedBy,
      nextMeeting: data.nextMeeting,
      attendees: data.attendees ? { create: data.attendees } : undefined,
      agendaItems: data.agendaItems
        ? {
            create: data.agendaItems.map((item) => ({
              number: item.number,
              title: item.title,
              order: item.order,
              subItems: { create: item.subItems },
            })),
          }
        : undefined,
    },
  });
  revalidatePath(`/projects/${projectId}/meetings`);
  revalidatePath(`/projects/${projectId}/meetings/${id}`);
}

export async function deleteMeeting(id: string, projectId: string) {
  await db.meeting.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/meetings`);
}
