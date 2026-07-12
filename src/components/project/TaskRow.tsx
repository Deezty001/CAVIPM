"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Check, ChevronRight, Clock3, MessageSquare, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PRIORITY_CONFIG, STATUS_CONFIG, getStatusCycle } from "@/lib/utils";
import { formatAUDate, formatDuration, isOverdue } from "@/lib/dates";
import { addComment, createTask, deleteTask, updateTask } from "@/actions/tasks";
import { TaskEditModal } from "./TaskEditModal";
import { TaskForm } from "./TaskForm";

type Task = {
  id: string; name: string; description: string | null; assigneeId: string | null; assigneeText: string | null;
  startDate: Date | null; dueDate: Date | null; duration: number | null; status: string; priority: string; order: number; phaseId: string;
  subtasks: Omit<Task, "subtasks" | "comments">[]; comments: { id: string; content: string; createdAt: Date }[];
  assignee: { name: string; initials: string } | null;
};
type Contact = { id: string; name: string; initials: string; title: string | null; organisation: string | null };
interface TaskRowProps { task: Task; projectId: string; contacts: Contact[]; phaseId: string }

export function TaskRow({ task, projectId, contacts, phaseId }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.TODO;
  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.NORMAL;
  const overdue = isOverdue(task.dueDate, task.status);
  const assigneeName = task.assignee?.name ?? task.assigneeText ?? "Unassigned";
  const completedSubtasks = task.subtasks.filter((item) => item.status === "DONE").length;

  function cycleStatus(event?: React.MouseEvent) { event?.stopPropagation(); startTransition(() => updateTask(task.id, projectId, { status: getStatusCycle(task.status) })); }
  function handleDelete() { if (confirm(`Delete "${task.name}"?`)) startTransition(() => deleteTask(task.id, projectId)); }
  function handleAddComment(event: React.FormEvent) { event.preventDefault(); if (!commentText.trim()) return; startTransition(async () => { await addComment(task.id, projectId, commentText.trim()); setCommentText(""); }); }
  function handleAddSubtask(data: Parameters<typeof createTask>[0]) { startTransition(async () => { await createTask({ ...data, phaseId, projectId, parentId: task.id }); setShowAddSubtask(false); }); }

  return <article className={`border-b border-slate-200 last:border-0 ${isPending ? "opacity-60" : ""}`}>
    <div className={`group grid min-h-[68px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 transition-colors hover:bg-slate-50 ${expanded ? "bg-slate-50" : "bg-white"}`}>
      <button onClick={cycleStatus} className={`grid h-5 w-5 place-items-center border transition-colors ${task.status === "DONE" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white hover:border-blue-600"}`} aria-label={`Change status for ${task.name}`}>
        {task.status === "DONE" && <Check className="h-3 w-3" />}
      </button>

      <button onClick={() => setExpanded((value) => !value)} className="min-w-0 py-3 text-left" aria-expanded={expanded}>
        <span className="flex min-w-0 items-center gap-2">
          <span className={`truncate text-[13px] font-semibold tracking-[-.01em] ${task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"}`}>{task.name}</span>
          {task.priority === "URGENT" && <span className="shrink-0 text-[9px] font-bold uppercase tracking-[.1em] text-red-700">Urgent</span>}
          {task.priority === "HIGH" && <span className="shrink-0 text-[9px] font-bold uppercase tracking-[.1em] text-amber-700">High</span>}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
          <span className="truncate">{assigneeName}</span>
          {task.subtasks.length > 0 && <span>{completedSubtasks}/{task.subtasks.length} subtasks</span>}
          {task.comments.length > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{task.comments.length}</span>}
        </span>
      </button>

      <div className="flex items-center gap-4">
        <div className="hidden w-24 text-right sm:block">
          <p className={`text-[11px] font-semibold tabular-nums ${overdue ? "text-red-700" : task.dueDate ? "text-slate-600" : "text-slate-300"}`}>{task.dueDate ? formatAUDate(task.dueDate) : "No due date"}</p>
          {overdue && <p className="text-[8px] font-bold uppercase tracking-[.12em] text-red-600">Overdue</p>}
        </div>
        <button onClick={cycleStatus} className={`hidden min-w-[82px] border-l-2 bg-transparent px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-[.1em] md:block ${task.status === "DONE" ? "border-emerald-600 text-emerald-700" : task.status === "BLOCKED" ? "border-red-600 text-red-700" : task.status === "IN_PROGRESS" ? "border-amber-600 text-amber-700" : "border-slate-300 text-slate-500"}`} title="Change status">{statusConfig.label}</button>
        <button onClick={() => setExpanded((value) => !value)} className="grid h-8 w-8 place-items-center text-slate-400 hover:text-slate-900" aria-label={expanded ? "Close task details" : "Open task details"}>
          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
      </div>
    </div>

    <AnimatePresence initial={false}>{expanded && <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.2}} className="overflow-hidden">
      <div className="border-t border-slate-200 bg-[#f7f8f6] px-5 py-6 sm:pl-12">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">Brief</p><p className={`mt-2 text-[13px] leading-6 ${task.description ? "text-slate-600" : "italic text-slate-400"}`}>{task.description || "No description has been added."}</p></div>
          <div className="flex shrink-0 items-center gap-1"><button onClick={()=>setEditOpen(true)} className="inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900"><Pencil className="h-3.5 w-3.5"/>Edit</button><button onClick={handleDelete} className="inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold text-slate-400 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-3.5 w-3.5"/>Delete</button></div>
        </div>

        <div className="mb-7 flex flex-wrap gap-x-8 gap-y-4 border-y border-slate-200 py-4">
          <Detail icon={<CalendarDays/>} label="Schedule" value={`${formatAUDate(task.startDate)} → ${formatAUDate(task.dueDate)}`} alert={overdue}/>
          <Detail icon={<Clock3/>} label="Duration" value={task.duration ? formatDuration(task.duration) : "Not estimated"}/>
          <Detail icon={<UserRound/>} label="Owner" value={assigneeName}/>
          <Detail label="Priority" value={priorityConfig.label} valueClassName={priorityConfig.className}/>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
          <section>
            <div className="mb-3 flex items-center justify-between"><h4 className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">Subtasks</h4>{task.subtasks.length>0&&<span className="text-[10px] text-slate-400">{completedSubtasks} of {task.subtasks.length} complete</span>}</div>
            {task.subtasks.length > 0 && <div className="border-t border-slate-200">{task.subtasks.map((subtask)=><SubtaskRow key={subtask.id} subtask={subtask} projectId={projectId} contacts={contacts}/>)}</div>}
            {showAddSubtask ? <div className="mt-3"><TaskForm contacts={contacts} onSubmit={handleAddSubtask as never} onCancel={()=>setShowAddSubtask(false)} loading={isPending} compact/></div> : <button onClick={()=>setShowAddSubtask(true)} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-900"><Plus className="h-3.5 w-3.5"/>Add subtask</button>}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between"><h4 className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">Notes</h4>{task.comments.length>0&&<span className="text-[10px] text-slate-400">{task.comments.length} update{task.comments.length!==1?"s":""}</span>}</div>
            {task.comments.length>0&&<div className="mb-3 max-h-36 space-y-3 overflow-y-auto border-l border-slate-200 pl-4">{task.comments.map((comment)=><div key={comment.id}><div className="flex justify-between gap-4"><span className="text-[10px] font-semibold text-slate-500">Progress note</span><time className="text-[9px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString("en-AU")}</time></div><p className="mt-1 text-xs leading-5 text-slate-600">{comment.content}</p></div>)}</div>}
            <form onSubmit={handleAddComment} className="flex gap-2"><input value={commentText} onChange={(e)=>setCommentText(e.target.value)} placeholder="Add a progress note…" className="h-9 min-w-0 flex-1 border border-slate-300 bg-white px-3 text-xs outline-none focus:border-blue-600"/><button type="submit" disabled={!commentText.trim()} className="h-9 bg-slate-900 px-4 text-[11px] font-semibold text-white disabled:opacity-30">Add</button></form>
          </section>
        </div>
      </div>
    </motion.div>}</AnimatePresence>

    {editOpen&&<TaskEditModal task={task} projectId={projectId} contacts={contacts} open={editOpen} onClose={()=>setEditOpen(false)}/>}
  </article>;
}

function Detail({icon,label,value,alert,valueClassName}:{icon?:React.ReactNode;label:string;value:string;alert?:boolean;valueClassName?:string}) { return <div className="min-w-[130px]"><p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400">{icon&&<span className="[&>svg]:h-3 [&>svg]:w-3">{icon}</span>}{label}</p><p className={`mt-1 text-xs font-semibold ${alert?"text-red-700":valueClassName??"text-slate-700"}`}>{value}</p></div>; }

function SubtaskRow({subtask,projectId,contacts}:{subtask:Omit<Task,"subtasks"|"comments">;projectId:string;contacts:Contact[]}) {
  const [isPending,startTransition]=useTransition(); const [editOpen,setEditOpen]=useState(false); const overdue=isOverdue(subtask.dueDate,subtask.status);
  function cycle(){startTransition(()=>updateTask(subtask.id,projectId,{status:getStatusCycle(subtask.status)}));}
  function remove(){if(confirm(`Delete "${subtask.name}"?`))startTransition(()=>deleteTask(subtask.id,projectId));}
  return <div className={`group flex min-h-11 items-center gap-3 border-b border-slate-200 px-1 ${isPending?"opacity-60":""}`}><button onClick={cycle} className={`grid h-4 w-4 place-items-center border ${subtask.status==="DONE"?"border-emerald-600 bg-emerald-600 text-white":"border-slate-300 bg-white"}`}>{subtask.status==="DONE"&&<Check className="h-2.5 w-2.5"/>}</button><span className={`min-w-0 flex-1 truncate text-xs ${subtask.status==="DONE"?"text-slate-400 line-through":"font-medium text-slate-700"}`}>{subtask.name}</span><span className={`text-[10px] ${overdue?"font-semibold text-red-700":"text-slate-400"}`}>{formatAUDate(subtask.dueDate)}</span><div className="flex opacity-0 group-hover:opacity-100"><button onClick={()=>setEditOpen(true)} className="p-1.5 text-slate-400 hover:text-slate-700"><Pencil className="h-3 w-3"/></button><button onClick={remove} className="p-1.5 text-slate-400 hover:text-red-700"><Trash2 className="h-3 w-3"/></button></div>{editOpen&&<TaskEditModal task={{...subtask,subtasks:[],comments:[]}} projectId={projectId} contacts={contacts} open={editOpen} onClose={()=>setEditOpen(false)}/>}</div>;
}
