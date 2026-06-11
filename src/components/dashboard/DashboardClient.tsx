"use client";

import { useState } from "react";
import { Plus, AlertCircle, Clock, FolderOpen, Layers } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";
import { Button } from "@/components/ui/Button";
import { isOverdue } from "@/lib/dates";

type Project = Awaited<ReturnType<typeof import("@/actions/projects").getProjects>>[number];

function computePortfolioStats(projects: Project[]) {
  let active = 0, totalLots = 0, blocked = 0, overdue = 0;
  for (const p of projects) {
    if (p.status === "ACTIVE") active++;
    if (p.lotCount) totalLots += p.lotCount;
    for (const phase of p.phases) {
      for (const t of phase.tasks) {
        if (t.status === "BLOCKED") blocked++;
        if (isOverdue(t.dueDate, t.status)) overdue++;
        for (const s of t.subtasks) {
          if (s.status === "BLOCKED") blocked++;
          if (isOverdue(s.dueDate, s.status)) overdue++;
        }
      }
    }
  }
  return { active, totalLots, blocked, overdue };
}

export function DashboardClient({ projects }: { projects: Project[] }) {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const stats = computePortfolioStats(projects);

  return (
    <div className="app-page">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="page-subtitle mb-1">Property development overview</p>
          <h1 className="page-title">Portfolio</h1>
        </div>
        <Button
          variant="primary"
          onClick={() => setNewProjectOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat
            label="Active projects"
            value={stats.active}
            icon={<FolderOpen className="w-4 h-4" />}
            color="text-[#4a6fa5]"
          />
          <Stat
            label="Total lots"
            value={stats.totalLots || "—"}
            icon={<Layers className="w-4 h-4" />}
            color="text-[#7a6faf]"
          />
          <Stat
            label="Blocked items"
            value={stats.blocked}
            icon={<AlertCircle className="w-4 h-4" />}
            color={stats.blocked > 0 ? "text-[#a03535]" : "text-[#a0a0a0]"}
            highlight={stats.blocked > 0}
          />
          <Stat
            label="Overdue"
            value={stats.overdue}
            icon={<Clock className="w-4 h-4" />}
            color={stats.overdue > 0 ? "text-[#96702a]" : "text-[#a0a0a0]"}
            highlight={stats.overdue > 0}
          />
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f0ee]"
          >
            <FolderOpen className="h-6 w-6 text-[#a0a0a0]" strokeWidth={1.5} />
          </div>
          <h2
            className="mb-2 text-[15px] font-semibold"
          >
            No projects yet
          </h2>
          <p className="mb-6 max-w-[280px] text-[13px] text-[#6b6b6b]">
            Create your first project to get started
          </p>
          <Button variant="primary" onClick={() => setNewProjectOpen(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Projects</h2>
            <span className="text-xs text-[#6b6b6b]">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
          </div>
        </>
      )}

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className="surface-card flex min-h-[104px] items-center gap-4 p-5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f3] ${color}`}>
        {icon}
      </div>
      <div>
        <div
          className={`text-[28px] font-bold leading-none tracking-[-0.3px] tabular-nums ${highlight ? color : "text-[#111111]"}`}
        >
          {value}
        </div>
        <div className="mt-1 text-xs text-[#6b6b6b]">
          {label}
        </div>
      </div>
    </div>
  );
}
