"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateInitials } from "@/lib/utils";

export async function createContact(data: {
  name: string;
  initials?: string;
  title?: string;
  organisation?: string;
  email?: string;
  phone?: string;
  isInternal?: boolean;
  projectId: string;
}) {
  const contact = await db.contact.create({
    data: {
      name: data.name,
      initials: data.initials ?? generateInitials(data.name),
      title: data.title,
      organisation: data.organisation,
      email: data.email,
      phone: data.phone,
      isInternal: data.isInternal ?? false,
      projectId: data.projectId,
    },
  });
  revalidatePath(`/projects/${data.projectId}`);
  return contact;
}

export async function updateContact(
  id: string,
  projectId: string,
  data: Partial<{
    name: string;
    initials: string;
    title: string;
    organisation: string;
    email: string;
    phone: string;
    isInternal: boolean;
  }>
) {
  await db.contact.update({ where: { id }, data });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteContact(id: string, projectId: string) {
  await db.contact.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
}
