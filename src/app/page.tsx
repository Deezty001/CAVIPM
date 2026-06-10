import { getProjects } from "@/actions/projects";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await getProjects();
  return <DashboardClient projects={projects} />;
}
