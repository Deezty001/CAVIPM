"use client";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { PHASE_NAMES, PROJECT_TYPE_LABELS } from "@/lib/utils";
import { isOverdue } from "@/lib/dates";

type Props = { project: { id:string; name:string; address:string; suburb:string; type:string; lotCount:number|null; status:string; phases:{order:number;tasks:{status:string;dueDate:Date|null;subtasks:{status:string;dueDate:Date|null}[]}[]}[] }; index:number };

export function ProjectCard({ project }: Props) {
  const items = project.phases.flatMap((p) => p.tasks.flatMap((t) => [t, ...t.subtasks]));
  const done = items.filter((t) => t.status === "DONE").length;
  const blocked = items.filter((t) => t.status === "BLOCKED").length;
  const overdue = items.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const pct = items.length ? Math.round(done / items.length * 100) : 0;
  return <Link href={`/projects/${project.id}`} className="group flex min-h-[310px] flex-col border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_16px_40px_rgba(15,23,18,.08)]">
    <div className="flex items-start justify-between border-b border-slate-100 p-5">
      <span className={`border-l-2 pl-2 text-[10px] font-semibold uppercase tracking-[.12em] ${project.status === "ACTIVE" ? "border-emerald-600 text-emerald-700" : project.status === "ON_HOLD" ? "border-amber-600 text-amber-700" : "border-slate-400 text-slate-500"}`}>{project.status === "ON_HOLD" ? "On hold" : project.status.toLowerCase()}</span>
      <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600" />
    </div>
    <div className="flex flex-1 flex-col p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">{PROJECT_TYPE_LABELS[project.type] ?? project.type}</p>
      <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-.035em] text-slate-900 group-hover:text-blue-700">{project.name}</h3>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3 w-3" />{project.suburb || project.address || "Location pending"}</p>
      <div className="mt-auto pt-8">
        <div className="mb-2 flex items-end justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Delivery progress</span><strong className="text-sm font-semibold tabular-nums">{pct}%</strong></div>
        <div className="flex h-1 bg-slate-100">{PHASE_NAMES.map((_, i) => { const phase = project.phases.find((p) => p.order === i); const phaseItems = phase?.tasks.flatMap((t) => [t,...t.subtasks]) ?? []; const phasePct = phaseItems.length ? phaseItems.filter((t) => t.status === "DONE").length / phaseItems.length * 100 : 0; return <span key={i} className="mr-px flex-1 bg-slate-100 last:mr-0"><span className="block h-full bg-blue-600" style={{width:`${phasePct}%`}} /></span>; })}</div>
        <div className="mt-5 grid grid-cols-3 border-t border-slate-100 pt-4 text-[11px]"><span><b className="block text-sm text-slate-900">{project.lotCount || "—"}</b><em className="not-italic text-slate-400">Lots</em></span><span><b className={blocked ? "block text-sm text-red-700" : "block text-sm text-slate-900"}>{blocked}</b><em className="not-italic text-slate-400">Blocked</em></span><span><b className={overdue ? "block text-sm text-amber-700" : "block text-sm text-slate-900"}>{overdue}</b><em className="not-italic text-slate-400">Overdue</em></span></div>
      </div>
    </div>
  </Link>;
}
