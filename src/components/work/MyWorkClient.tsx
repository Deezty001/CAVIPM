"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronRight, Clock3, Inbox, Plus, Search, Sparkles } from "lucide-react";
import { createPersonalAction, updatePersonalAction, updateWorkTask } from "@/actions/my-work";
import { Button } from "@/components/ui/Button";
import { formatAUDate, isOverdue } from "@/lib/dates";

type WorkData = Awaited<ReturnType<typeof import("@/actions/my-work").getMyWork>>;
type View = "TODAY" | "UPCOMING" | "OVERDUE" | "WAITING" | "UNSCHEDULED" | "DONE";

export function MyWorkClient({ data }: { data: WorkData }) {
  const [view, setView] = useState<View>("TODAY");
  const [capture, setCapture] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const items = useMemo(() => [
    ...data.personalActions.map((a) => ({ id:a.id, kind:"personal" as const, title:a.title, status:a.status, priority:a.priority, plannedDate:a.plannedDate, dueDate:a.dueDate, estimateMinutes:a.estimateMinutes, project:a.project, phaseName:null })),
    ...data.projectTasks.map((t) => ({ id:t.id, kind:"project" as const, title:t.name, status:t.status, priority:t.priority, plannedDate:t.plannedDate, dueDate:t.dueDate, estimateMinutes:t.estimateMinutes, project:t.phase.project, phaseName:t.phase.name })),
  ], [data]);
  const visible = items.filter((item) => {
    if (!item.title.toLowerCase().includes(query.toLowerCase())) return false;
    const planned = item.plannedDate ? new Date(item.plannedDate) : null; if (planned) planned.setHours(0,0,0,0);
    const due = item.dueDate ? new Date(item.dueDate) : null; if (due) due.setHours(0,0,0,0);
    if (view === "TODAY") return item.status !== "DONE" && (planned?.getTime() === today.getTime() || due?.getTime() === today.getTime());
    if (view === "UPCOMING") return item.status !== "DONE" && !!due && due > today;
    if (view === "OVERDUE") return item.status !== "DONE" && !!due && due < today;
    if (view === "WAITING") return item.status === "WAITING" || item.status === "BLOCKED";
    if (view === "UNSCHEDULED") return item.status !== "DONE" && !planned && !due;
    return item.status === "DONE";
  });
  const overdueCount = items.filter((i) => isOverdue(i.dueDate, i.status)).length;

  function addAction(e: React.FormEvent) { e.preventDefault(); if (!capture.trim()) return; startTransition(async () => { await createPersonalAction({ title:capture.trim(), plannedDate:today }); setCapture(""); }); }
  function complete(item: (typeof items)[number]) { startTransition(async () => { if (item.kind === "personal") await updatePersonalAction(item.id, { status:"DONE" }); else await updateWorkTask(item.id, item.project.id, { status:"DONE" }); }); }

  return <div className="app-page">
    <header className="mb-8 flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end">
      <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-blue-600">Personal command centre</p><h1 className="text-[clamp(34px,4vw,52px)] font-semibold leading-none tracking-[-.055em]">My work</h1><p className="mt-4 text-sm text-slate-500">A clear plan across every development, follow-up, and personal action.</p></div>
      <div className="flex gap-6 text-right"><div><b className="block text-2xl tracking-[-.04em]">{visible.length}</b><span className="text-[10px] uppercase tracking-[.12em] text-slate-400">In this view</span></div><div><b className={overdueCount ? "block text-2xl tracking-[-.04em] text-red-700" : "block text-2xl tracking-[-.04em]"}>{overdueCount}</b><span className="text-[10px] uppercase tracking-[.12em] text-slate-400">Overdue</span></div></div>
    </header>

    <section className="mb-7 border border-slate-200 bg-white p-3 shadow-sm">
      <form onSubmit={addAction} className="flex items-center gap-3"><Plus className="ml-2 h-4 w-4 text-blue-600" /><input value={capture} onChange={(e)=>setCapture(e.target.value)} placeholder="Add an action for today…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" aria-label="New personal action" /><span className="hidden items-center gap-1 text-[10px] text-slate-400 md:flex"><Sparkles className="h-3 w-3" /> Smart capture coming next</span><Button type="submit" variant="primary" disabled={isPending || !capture.trim()}>Add</Button></form>
    </section>

    <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside><p className="mb-3 px-2 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Views</p><nav className="border-y border-slate-200">{(["TODAY","UPCOMING","OVERDUE","WAITING","UNSCHEDULED","DONE"] as View[]).map((key) => <button key={key} onClick={()=>setView(key)} className={`flex w-full items-center justify-between border-b border-slate-100 px-3 py-3 text-left text-xs font-semibold last:border-0 ${view===key ? "border-l-2 border-l-blue-600 bg-white text-slate-950" : "text-slate-500 hover:bg-white"}`}><span>{key.charAt(0)+key.slice(1).toLowerCase()}</span>{key==="OVERDUE"&&overdueCount>0?<span className="text-red-700">{overdueCount}</span>:<ChevronRight className="h-3 w-3 text-slate-300" />}</button>)}</nav></aside>
      <main>
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Focus list</p><h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">{view.charAt(0)+view.slice(1).toLowerCase()}</h2></div><label className="flex h-9 items-center gap-2 border border-slate-300 bg-white px-3"><Search className="h-3.5 w-3.5 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Filter work" className="w-28 bg-transparent text-xs outline-none" /></label></div>
        {visible.length ? <div className="border-t border-slate-300">{visible.map((item) => <article key={`${item.kind}-${item.id}`} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-slate-200 bg-white px-4 py-4 hover:bg-slate-50">
          <button onClick={()=>complete(item)} disabled={isPending || item.status==="DONE"} className={`grid h-5 w-5 place-items-center border ${item.status==="DONE" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white hover:border-blue-600"}`} aria-label={`Complete ${item.title}`}>{item.status==="DONE"&&<Check className="h-3 w-3"/>}</button>
          <div className="min-w-0"><div className="flex items-center gap-2"><h3 className={`truncate text-[13px] font-semibold ${item.status==="DONE"?"text-slate-400 line-through":"text-slate-900"}`}>{item.title}</h3>{item.priority==="URGENT"&&<span className="text-[9px] font-bold uppercase tracking-wider text-red-700">Urgent</span>}</div><p className="mt-1 truncate text-[10px] text-slate-400">{item.kind==="personal"?"Personal action":`${item.project.name} · ${item.phaseName}`}</p></div>
          <div className="flex items-center gap-4">{item.estimateMinutes&&<span className="hidden items-center gap-1 text-[10px] text-slate-400 sm:flex"><Clock3 className="h-3 w-3"/>{item.estimateMinutes}m</span>}{item.dueDate?<span className={`text-[10px] font-semibold ${isOverdue(item.dueDate,item.status)?"text-red-700":"text-slate-500"}`}>{formatAUDate(item.dueDate)}</span>:<span className="text-[10px] text-slate-300">No date</span>}{item.kind==="project"&&<Link href={`/projects/${item.project.id}`} aria-label="Open project"><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600"/></Link>}</div>
        </article>)}</div>:<div className="border border-dashed border-slate-300 bg-white py-20 text-center"><Inbox className="mx-auto h-6 w-6 text-slate-300"/><h3 className="mt-4 text-sm font-semibold">Nothing here</h3><p className="mt-1 text-xs text-slate-400">This view is clear. Add an action or choose another view.</p></div>}
      </main>
    </div>
  </div>;
}
