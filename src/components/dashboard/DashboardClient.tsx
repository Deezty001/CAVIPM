"use client";

import { useMemo, useState } from "react";
import { Plus, AlertTriangle, ArrowDownUp, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";
import { Button } from "@/components/ui/Button";
import { isOverdue } from "@/lib/dates";

type Project = Awaited<ReturnType<typeof import("@/actions/projects").getProjects>>[number];

function computePortfolioStats(projects: Project[]) {
  let active = 0, totalLots = 0, blocked = 0, overdue = 0, done = 0, total = 0;
  for (const p of projects) {
    if (p.status === "ACTIVE") active++;
    totalLots += p.lotCount || 0;
    for (const phase of p.phases) for (const task of phase.tasks) {
      const items = [task, ...task.subtasks];
      for (const item of items) { total++; if (item.status === "DONE") done++; if (item.status === "BLOCKED") blocked++; if (isOverdue(item.dueDate, item.status)) overdue++; }
    }
  }
  return { active, totalLots, blocked, overdue, completion: total ? Math.round(done / total * 100) : 0 };
}

export function DashboardClient({ projects }: { projects: Project[] }) {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "ON_HOLD" | "COMPLETE">("ALL");
  const stats = computePortfolioStats(projects);
  const filtered = useMemo(() => projects.filter((p) => {
    const matches = `${p.name} ${p.address} ${p.suburb}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === "ALL" || p.status === filter);
  }), [projects, query, filter]);

  return (
    <div className="app-page">
      <header className="mb-8 grid gap-7 border-b border-slate-200 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-blue-600">Portfolio overview · NSW</p>
          <h1 className="text-[clamp(32px,4vw,52px)] font-semibold leading-none tracking-[-.055em] text-slate-950">Development portfolio</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">A live view of delivery progress, programme risk, and the work requiring your attention.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setNewProjectOpen(true)} className="self-start lg:self-auto">
          <Plus className="h-4 w-4" /> Create project
        </Button>
      </header>

      {projects.length > 0 && <section className="mb-10 overflow-hidden border-y border-slate-200 bg-white">
        <div className="grid grid-cols-2 lg:grid-cols-5">
          <Metric label="Active projects" value={stats.active} detail={`${projects.length} total`} />
          <Metric label="Lots under management" value={stats.totalLots || "—"} detail="Across portfolio" />
          <Metric label="Portfolio completion" value={`${stats.completion}%`} detail="All tracked work" />
          <Metric label="Blocked items" value={stats.blocked} detail={stats.blocked ? "Needs intervention" : "Clear"} alert={stats.blocked > 0} />
          <Metric label="Overdue items" value={stats.overdue} detail={stats.overdue ? "Schedule exposure" : "On programme"} alert={stats.overdue > 0} />
        </div>
      </section>}

      {projects.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-24 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Portfolio empty</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-.03em]">Start with your first development</h2>
          <p className="mx-auto mb-7 mt-2 max-w-md text-sm text-slate-500">Set up the property, load the standard delivery programme, and create one source of truth for the team.</p>
          <Button variant="primary" onClick={() => setNewProjectOpen(true)}><Plus className="h-4 w-4" /> Create project</Button>
        </div>
      ) : (
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Projects / {filtered.length}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-.03em] text-slate-900">Current developments</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 border border-slate-300 bg-white px-3 sm:w-60 sm:flex-none" aria-label="Search projects">
                <Search className="h-3.5 w-3.5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search portfolio" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
              </label>
              <label className="flex h-10 items-center gap-2 border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600">
                <SlidersHorizontal className="h-3.5 w-3.5" /><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="bg-transparent outline-none"><option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option><option value="COMPLETE">Complete</option></select>
              </label>
              <button className="grid h-10 w-10 place-items-center border border-slate-300 bg-white text-slate-500 hover:bg-slate-50" aria-label="Sort projects"><ArrowDownUp className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          {filtered.length ? <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((project, i) => <ProjectCard key={project.id} project={project} index={i} />)}</motion.div> : <div className="border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">No projects match this view.</div>}
        </section>
      )}
      <NewProjectModal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />
    </div>
  );
}

function Metric({ label, value, detail, alert = false }: { label: string; value: string | number; detail: string; alert?: boolean }) {
  return <div className="relative min-h-32 border-b border-r border-slate-200 p-5 lg:border-b-0">
    <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">{label}</span>{alert && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}</div>
    <div className={`mt-5 text-3xl font-semibold tracking-[-.05em] tabular-nums ${alert ? "text-red-700" : "text-slate-950"}`}>{value}</div>
    <div className="mt-1 text-[11px] text-slate-400">{detail}</div>
  </div>;
}
