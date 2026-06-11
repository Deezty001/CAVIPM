"use client";

import { useState } from "react";
import { Plus, AlertCircle, Clock, FolderOpen, Layers } from "lucide-react";
import { motion } from "framer-motion";
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function DashboardClient({ projects }: { projects: Project[] }) {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const stats = computePortfolioStats(projects);

  return (
    <div className="app-page max-w-[1240px] px-4 py-8 md:px-8">
      {/* Header Panel */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 font-display">
            Property Development Workspace
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display sm:text-4xl">
            Project Portfolio
          </h1>
        </div>
        <Button
          variant="primary"
          onClick={() => setNewProjectOpen(true)}
          className="gap-2 shadow-md hover:shadow-lg self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants}>
            <Stat
              label="Active projects"
              value={stats.active}
              icon={<FolderOpen className="w-5 h-5" />}
              color="text-blue-600 bg-blue-50 border-blue-100"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Stat
              label="Total lots"
              value={stats.totalLots || "—"}
              icon={<Layers className="w-5 h-5" />}
              color="text-indigo-600 bg-indigo-50 border-indigo-100"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Stat
              label="Blocked items"
              value={stats.blocked}
              icon={<AlertCircle className="w-5 h-5" />}
              color={stats.blocked > 0 ? "text-rose-600 bg-rose-50 border-rose-100" : "text-slate-400 bg-slate-50 border-slate-100"}
              highlight={stats.blocked > 0}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Stat
              label="Overdue items"
              value={stats.overdue}
              icon={<Clock className="w-5 h-5" />}
              color={stats.overdue > 0 ? "text-amber-600 bg-amber-50 border-amber-100" : "text-slate-400 bg-slate-50 border-slate-100"}
              highlight={stats.overdue > 0}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="surface-card flex flex-col items-center justify-center px-6 py-20 text-center border border-slate-150 rounded-2xl"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <FolderOpen className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-bold text-slate-800 font-display">
            No projects yet
          </h2>
          <p className="mb-6 max-w-[320px] text-sm text-slate-500 leading-relaxed">
            Create your first property development project to start tracking stages, tasks, meetings, and Gantt charts.
          </p>
          <Button variant="primary" onClick={() => setNewProjectOpen(true)} className="gap-2">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Project
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 tracking-tight font-display">
              All Properties
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {projects.map((project, i) => (
              <motion.div key={project.id} variants={itemVariants}>
                <ProjectCard project={project} index={i} />
              </motion.div>
            ))}
          </motion.div>
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
    <div className="surface-card border border-slate-100/80 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all duration-300">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`text-2xl font-bold leading-none tracking-tight font-display tabular-nums ${highlight ? "text-slate-900" : "text-slate-900"}`}>
          {value}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-500 truncate">
          {label}
        </div>
      </div>
    </div>
  );
}
