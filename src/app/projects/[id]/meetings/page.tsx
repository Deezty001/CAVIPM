import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { getMeetings } from "@/actions/meetings";
import { MeetingsListClient } from "@/components/meetings/MeetingsListClient";

export const dynamic = "force-dynamic";

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, meetings] = await Promise.all([getProject(id), getMeetings(id)]);
  if (!project) notFound();
  return <MeetingsListClient project={project} meetings={meetings} />;
}
