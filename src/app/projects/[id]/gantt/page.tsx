import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { GanttClient } from "@/components/gantt/GanttClient";

export const dynamic = "force-dynamic";

export default async function GanttPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <GanttClient project={project} />;
}
