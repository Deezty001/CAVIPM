import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { ProjectDetailClient } from "@/components/project/ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <ProjectDetailClient project={project} />;
}
