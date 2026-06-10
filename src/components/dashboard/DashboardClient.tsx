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
    <div
      className="max-w-screen-xl mx-auto px-6 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}
          >
            Portfolio
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
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

      {/* Stats bar */}
      {projects.length > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 rounded-xl border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          <Stat
            label="Active projects"
            value={stats.active}
            icon={<FolderOpen className="w-4 h-4" />}
            color="text-teal-600"
          />
          <Stat
            label="Total lots"
            value={stats.totalLots || "—"}
            icon={<Layers className="w-4 h-4" />}
            color="text-blue-600"
          />
          <Stat
            label="Blocked items"
            value={stats.blocked}
            icon={<AlertCircle className="w-4 h-4" />}
            color={stats.blocked > 0 ? "text-red-500" : "text-slate-400"}
            highlight={stats.blocked > 0}
          />
          <Stat
            label="Overdue"
            value={stats.overdue}
            icon={<Clock className="w-4 h-4" />}
            color={stats.overdue > 0 ? "text-orange-500" : "text-slate-400"}
            highlight={stats.overdue > 0}
          />
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--accent-light)" }}
          >
            <FolderOpen className="w-7 h-7" style={{ color: "var(--accent)" }} />
          </div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}
          >
            No projects yet
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Create your first project to get started
          </p>
          <Button variant="primary" onClick={() => setNewProjectOpen(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
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
    <div className="flex items-center gap-2.5">
      <div
        className={`${color} opacity-80`}
      >
        {icon}
      </div>
      <div>
        <div
          className={`text-lg font-bold tabular-nums leading-none ${highlight ? color : ""}`}
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {value}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}
