"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, BarChart3, Download } from "lucide-react";
import { PHASE_NAMES, PHASE_GANTT_COLORS } from "@/lib/utils";
import { isBusinessDay } from "@/lib/holidays";
import { formatAUDate, formatDuration } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { createTask, updateTask } from "@/actions/tasks";

type Project = NonNullable<Awaited<ReturnType<typeof import("@/actions/projects").getProject>>>;
type ZoomLevel = "day" | "week" | "month" | "quarter";

function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);
  while (cur <= endD) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function parseAsLocalDate(dateInput: Date | string | null): Date {
  if (!dateInput) return new Date();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date();
  
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  } else if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

interface GanttBarInfo {
  id: string;
  name: string;
  start: Date;
  end: Date;
  status: string;
  priority: string;
  phaseId: string;
  phaseIndex: number;
  phaseName: string;
  assigneeText: string | null;
  duration: number | null;
  isSubtask: boolean;
}

export function GanttClient({ project }: { project: Project }) {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [colorMode, setColorMode] = useState<"phase" | "status" | "priority">("phase");
  const [scrollLeft, setScrollLeft] = useState(0);
  const [tooltip, setTooltip] = useState<{ bar: GanttBarInfo; x: number; y: number } | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Dragging interaction states
  const [dragState, setDragState] = useState<{
    taskId: string;
    isSubtask: boolean;
    type: "move" | "resize-start" | "resize-end";
    initialStart: Date;
    initialEnd: Date;
    startX: number;
  } | null>(null);
  const [tempDates, setTempDates] = useState<{
    [taskId: string]: { start: Date; end: Date };
  }>({});

  // Quick task creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPhaseId, setModalPhaseId] = useState("");
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Collect all bars
  const bars: GanttBarInfo[] = [];
  for (const phase of [...project.phases].sort((a: { order: number }, b: { order: number }) => a.order - b.order)) {
    const phaseIndex = phase.order;
    for (const task of [...phase.tasks].sort((a: { order: number }, b: { order: number }) => a.order - b.order)) {
      if (task.startDate && task.dueDate) {
        const override = tempDates[task.id];
        bars.push({
          id: task.id,
          name: task.name,
          start: override?.start ?? parseAsLocalDate(task.startDate),
          end: override?.end ?? parseAsLocalDate(task.dueDate),
          status: task.status,
          priority: task.priority,
          phaseId: phase.id,
          phaseIndex,
          phaseName: phase.name,
          assigneeText: task.assigneeText ?? task.assignee?.name ?? null,
          duration: task.duration,
          isSubtask: false,
        });
      }
      for (const sub of task.subtasks) {
        if (sub.startDate && sub.dueDate) {
          const override = tempDates[sub.id];
          bars.push({
            id: sub.id,
            name: sub.name,
            start: override?.start ?? parseAsLocalDate(sub.startDate),
            end: override?.end ?? parseAsLocalDate(sub.dueDate),
            status: sub.status,
            priority: sub.priority,
            phaseId: phase.id,
            phaseIndex,
            phaseName: phase.name,
            assigneeText: sub.assigneeText ?? sub.assignee?.name ?? null,
            duration: sub.duration,
            isSubtask: true,
          });
        }
      }
    }
  }

  // Compute date range
  const allDates = bars.flatMap((b) => [b.start, b.end]);
  const minDate =
    allDates.length > 0
      ? new Date(Math.min(...allDates.map((d) => d.getTime())))
      : addDays(today, -7);
  const maxDate =
    allDates.length > 0
      ? new Date(Math.max(...allDates.map((d) => d.getTime())))
      : addDays(today, 30);

  // Pad range
  const rangeStart = addDays(minDate, -7);
  const rangeEnd = addDays(maxDate, 14);

  const allRangeDays = getDaysInRange(rangeStart, rangeEnd);

  const colWidth = zoom === "day" ? 64 : zoom === "week" ? 40 : zoom === "month" ? 24 : 14;
  const rowHeight = 36;
  const labelWidth = 240;

  function dayToX(date: Date): number {
    const diff = Math.round((date.getTime() - rangeStart.getTime()) / 86400000);
    return labelWidth + diff * colWidth;
  }

  function barStyle(bar: GanttBarInfo) {
    const x = dayToX(bar.start);
    const diffDays = Math.round((bar.end.getTime() - bar.start.getTime()) / 86400000);
    const w = Math.max(colWidth, diffDays * colWidth + colWidth);
    return { x, w };
  }

  const totalWidth = labelWidth + allRangeDays.length * colWidth;
  const todayX = dayToX(today);

  // Group bars by phase
  const phaseGroups: { phaseId: string; phaseIndex: number; phaseName: string; bars: GanttBarInfo[] }[] = [];
  for (const phase of [...project.phases].sort((a: { order: number }, b: { order: number }) => a.order - b.order)) {
    const phaseBars = bars.filter((b) => b.phaseId === phase.id);
    if (phaseBars.length > 0) {
      phaseGroups.push({ phaseId: phase.id, phaseIndex: phase.order, phaseName: phase.name, bars: phaseBars });
    }
  }

  // Flatten with section headers
  type Row = { type: "header"; phaseId: string; phaseName: string; phaseIndex: number } | { type: "bar"; bar: GanttBarInfo };
  const rows: Row[] = [];
  for (const group of phaseGroups) {
    rows.push({ type: "header", phaseId: group.phaseId, phaseName: group.phaseName, phaseIndex: group.phaseIndex });
    for (const bar of group.bars) {
      rows.push({ type: "bar", bar });
    }
  }

  const svgHeight = rows.length * rowHeight + 40;

  // Scroll handler for sticky columns
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  // Dragging event handlers
  const handlePointerDown = (
    e: React.PointerEvent<SVGElement>,
    taskId: string,
    isSubtask: boolean,
    type: "move" | "resize-start" | "resize-end",
    initialStart: Date,
    initialEnd: Date
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({
      taskId,
      isSubtask,
      type,
      initialStart,
      initialEnd,
      startX: e.clientX,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGElement>) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const daysMoved = Math.round(dx / colWidth);
    
    let newStart = new Date(dragState.initialStart);
    let newEnd = new Date(dragState.initialEnd);
    
    if (dragState.type === "move") {
      newStart = addDays(dragState.initialStart, daysMoved);
      newEnd = addDays(dragState.initialEnd, daysMoved);
    } else if (dragState.type === "resize-start") {
      newStart = addDays(dragState.initialStart, daysMoved);
      if (newStart.getTime() > dragState.initialEnd.getTime()) {
        newStart = new Date(dragState.initialEnd);
      }
    } else if (dragState.type === "resize-end") {
      newEnd = addDays(dragState.initialEnd, daysMoved);
      if (newEnd.getTime() < dragState.initialStart.getTime()) {
        newEnd = new Date(dragState.initialStart);
      }
    }
    
    setTempDates((prev) => ({
      ...prev,
      [dragState.taskId]: { start: newStart, end: newEnd },
    }));
  };

  const handlePointerUp = async (e: React.PointerEvent<SVGElement>) => {
    if (!dragState) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const finalDates = tempDates[dragState.taskId];
    const taskId = dragState.taskId;
    
    setDragState(null);
    
    if (finalDates) {
      const calendarDays = Math.round((finalDates.end.getTime() - finalDates.start.getTime()) / 86400000) + 1;
      
      startTransition(async () => {
        try {
          await updateTask(taskId, project.id, {
            startDate: finalDates.start,
            dueDate: finalDates.end,
            duration: calendarDays,
          });
        } catch (err) {
          console.error("Failed to update task dates", err);
        }
      });
      
      setTimeout(() => {
        setTempDates((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }, 500);
    }
  };

  // Quick task creation
  const openQuickAdd = (phaseId: string, initialDate?: Date) => {
    setModalPhaseId(phaseId);
    setNewName("");
    setNewPriority("NORMAL");
    setNewAssigneeId("");
    
    const dateObj = initialDate ?? new Date();
    const formattedDate = dateObj.toISOString().split("T")[0];
    setNewStart(formattedDate);
    setNewEnd(formattedDate);
    
    setIsModalOpen(true);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !modalPhaseId) return;
    
    setIsSubmitting(true);
    
    const selectedContact = project.contacts.find((c) => c.id === newAssigneeId);
    const assigneeText = selectedContact?.name ?? "";
    
    const startD = newStart ? new Date(newStart) : undefined;
    const endD = newEnd ? new Date(newEnd) : undefined;
    let duration: number | undefined = undefined;
    
    if (startD && endD) {
      duration = Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1;
    }
    
    startTransition(async () => {
      try {
        await createTask({
          name: newName,
          phaseId: modalPhaseId,
          projectId: project.id,
          startDate: startD,
          dueDate: endD,
          duration,
          priority: newPriority,
          assigneeId: newAssigneeId || undefined,
          assigneeText,
          status: "TODO",
        });
        setIsModalOpen(false);
      } catch (err) {
        console.error("Failed to create task", err);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // Color mappers
  function getBarColor(bar: GanttBarInfo): string {
    if (colorMode === "phase") {
      return PHASE_GANTT_COLORS[bar.phaseIndex] || "#64748b";
    }
    if (colorMode === "status") {
      if (bar.status === "DONE") return "#10b981";
      if (bar.status === "IN_PROGRESS") return "#f97316";
      if (bar.status === "BLOCKED") return "#ef4444";
      return "#64748b";
    }
    if (colorMode === "priority") {
      if (bar.priority === "URGENT") return "#ef4444";
      if (bar.priority === "HIGH") return "#f59e0b";
      if (bar.priority === "NORMAL") return "#3b82f6";
      return "#94a3b8";
    }
    return "#64748b";
  }

  function getProgressValue(status: string): number {
    if (status === "DONE") return 1.0;
    if (status === "IN_PROGRESS") return 0.5;
    if (status === "BLOCKED") return 0.25;
    return 0.0;
  }

  // Helper to get fully resolved self-contained SVG string for export
  function getResolvedSVGSource(svgElement: SVGSVGElement) {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    // Replace CSS variables with explicit values for compatibility
    source = source.replace(/var\(--bg-muted\)/g, "#f8fafc");
    source = source.replace(/var\(--bg-surface\)/g, "#ffffff");
    source = source.replace(/var\(--text-primary\)/g, "#0f172a");
    source = source.replace(/var\(--text-secondary\)/g, "#475569");
    source = source.replace(/var\(--text-tertiary\)/g, "#64748b");
    source = source.replace(/var\(--border\)/g, "#e2e8f0");
    source = source.replace(/var\(--accent\)/g, "#3b82f6");
    
    // Replace font variables with web-safe / system fallbacks
    source = source.replace(/var\(--font-display\)/g, "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif");
    source = source.replace(/var\(--font-sans\)/g, "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif");

    // Reset translation of the sticky labels column in the exported SVG source code
    source = source.replace(
      /(<g[^>]*id="sticky-left-col"[^>]*transform=")(translate\([^)]+\))("[^>]*>)/g,
      `$1translate(0,0)$3`
    );

    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    return '<?xml version="1.0" encoding="utf-8"?>\n' + source;
  }

  function exportSVG() {
    const svg = document.getElementById("gantt-svg") as SVGSVGElement | null;
    if (!svg) return;
    const source = getResolvedSVGSource(svg);
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-")}-gantt.svg`;
    a.click();
  }

  function exportPNG() {
    const svg = document.getElementById("gantt-svg") as SVGSVGElement | null;
    if (!svg) return;
    const width = totalWidth;
    const height = svgHeight + 40;
    const source = getResolvedSVGSource(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.width = width;
    img.height = height;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2; // High DPI export
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${project.name.replace(/\s+/g, "-")}-gantt.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div className="app-page max-w-[1240px] px-4 py-8 md:px-8">
      {/* Breadcrumb */}
      <Link
        href={`/projects/${project.id}`}
        className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        {project.name}
      </Link>

      <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display sm:text-4xl">
            Gantt Timeline
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Schedule visualization
          </p>
        </div>

        {/* Controls block */}
        <div className="flex flex-wrap items-center gap-4 self-start lg:self-auto">
          {/* Export options */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportSVG}
              className="gap-1.5 bg-white border-slate-200 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              SVG
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportPNG}
              className="gap-1.5 bg-white border-slate-200 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              PNG
            </Button>
          </div>

          {/* Color Mode controls */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1.5 border border-slate-200/40">
            {(["phase", "status", "priority"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                className={`rounded-lg px-3.5 py-1.5 capitalize transition-all text-[12px] font-bold cursor-pointer ${
                  colorMode === mode 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {mode === "phase" ? "Phase" : mode === "status" ? "Status" : "Priority"}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1.5 border border-slate-200/40">
            {(["day", "week", "month", "quarter"] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`rounded-lg px-4 py-1.5 capitalize transition-all text-[13px] font-bold cursor-pointer ${
                  zoom === z 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bars.length === 0 ? (
        <div className="surface-card py-20 text-center border border-slate-100 rounded-2xl">
          <p className="text-sm font-semibold text-slate-500">
            No schedule coordinates found.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Add start and due dates to your tasks or subtasks to generate the Gantt chart.
          </p>
        </div>
      ) : (
        <div
          className="surface-card overflow-auto border border-slate-100 rounded-2xl bg-white shadow-sm scrollbar-thin select-none"
          style={{
            maxHeight: "calc(100vh - 220px)",
          }}
          onScroll={handleScroll}
        >
          <svg
            id="gantt-svg"
            width={totalWidth}
            height={svgHeight + 40}
            style={{ display: "block", minWidth: "100%" }}
            onMouseLeave={() => setTooltip(null)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Date header — months & subheaders */}
            <MonthHeader
              days={allRangeDays}
              colWidth={colWidth}
              labelWidth={labelWidth}
              zoom={zoom}
            />

            {/* Column backgrounds and grid lines */}
            {allRangeDays.map((day, i) => {
              const x = labelWidth + i * colWidth;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isHoliday = !isWeekend && !isBusinessDay(day);
              const isToday = day.toDateString() === today.toDateString();
              const showGridLine = zoom === "day" || zoom === "week" || (zoom === "month" && day.getDay() === 1) || (zoom === "quarter" && day.getDay() === 1 && i % 2 === 0);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={0}
                    width={colWidth}
                    height={svgHeight + 40}
                    fill={
                      isToday
                        ? "rgba(59,130,246,0.08)"
                        : isWeekend
                        ? "rgba(15,23,42,0.015)"
                        : isHoliday
                        ? "rgba(245,158,11,0.05)"
                        : "transparent"
                    }
                  />
                  {showGridLine && (
                    <line
                      x1={x}
                      y1={40}
                      x2={x}
                      y2={svgHeight + 40}
                      stroke="var(--border)"
                      strokeWidth={0.5}
                      strokeOpacity={0.4}
                    />
                  )}
                </g>
              );
            })}

            {/* Row backgrounds & bars (timeline area only) */}
            {rows.map((row, i) => {
              const y = 40 + i * rowHeight;
              if (row.type === "header") {
                const color = PHASE_GANTT_COLORS[row.phaseIndex] || "#64748b";
                return (
                  <g key={`header-${i}`}>
                    <rect
                      x={labelWidth}
                      y={y}
                      width={totalWidth - labelWidth}
                      height={rowHeight}
                      fill={color}
                      fillOpacity={0.1}
                    />
                    <line
                      x1={labelWidth}
                      y1={y + rowHeight}
                      x2={totalWidth}
                      y2={y + rowHeight}
                      stroke="var(--border)"
                      strokeWidth={1}
                    />
                  </g>
                );
              }
              const { bar } = row;
              const { x, w } = barStyle(bar);
              const color = getBarColor(bar);
              const isBlocked = bar.status === "BLOCKED";
              const progress = getProgressValue(bar.status);
              
              const barY = y + (bar.isSubtask ? 10 : 8);
              const barH = bar.isSubtask ? rowHeight - 20 : rowHeight - 16;

              return (
                <g key={`bar-${bar.id}`}>
                  {/* Row click catcher background for double click quick add */}
                  <rect
                    x={labelWidth}
                    y={y}
                    width={totalWidth - labelWidth}
                    height={rowHeight}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onDoubleClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const diffDays = Math.round(clickX / colWidth);
                      const clickedDate = addDays(rangeStart, diffDays);
                      openQuickAdd(bar.phaseId, clickedDate);
                    }}
                  />

                  {/* Row divider line spanning timeline */}
                  <line
                    x1={labelWidth}
                    y1={y + rowHeight}
                    x2={totalWidth}
                    y2={y + rowHeight}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                    strokeOpacity={0.4}
                  />

                  {/* Main translucent bar background */}
                  <rect
                    x={x}
                    y={barY}
                    width={Math.max(w, 5)}
                    height={barH}
                    rx={5}
                    fill={color}
                    fillOpacity={0.25}
                    stroke={isBlocked ? "#ef4444" : "transparent"}
                    strokeWidth={isBlocked ? 2 : 0}
                  />

                  {/* Solid progress fill bar */}
                  {progress > 0 && (
                    <rect
                      x={x}
                      y={barY}
                      width={Math.max(w * progress, 0)}
                      height={barH}
                      rx={5}
                      fill={color}
                      fillOpacity={0.85}
                    />
                  )}

                  {/* Draggable center overlay body */}
                  <rect
                    x={x + 6}
                    y={barY}
                    width={Math.max(w - 12, 0)}
                    height={barH}
                    fill="transparent"
                    style={{ cursor: "move" }}
                    onPointerDown={(e) =>
                      handlePointerDown(e, bar.id, bar.isSubtask, "move", bar.start, bar.end)
                    }
                    onMouseEnter={(e) => {
                      setTooltip({
                        bar,
                        x: e.clientX + 12,
                        y: e.clientY - 10,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />

                  {/* Resize left handle */}
                  <rect
                    x={x}
                    y={barY}
                    width={6}
                    height={barH}
                    fill="transparent"
                    style={{ cursor: "w-resize" }}
                    onPointerDown={(e) =>
                      handlePointerDown(e, bar.id, bar.isSubtask, "resize-start", bar.start, bar.end)
                    }
                  />

                  {/* Resize right handle */}
                  <rect
                    x={x + w - 6}
                    y={barY}
                    width={6}
                    height={barH}
                    fill="transparent"
                    style={{ cursor: "e-resize" }}
                    onPointerDown={(e) =>
                      handlePointerDown(e, bar.id, bar.isSubtask, "resize-end", bar.start, bar.end)
                    }
                  />

                  {/* Bar text label */}
                  {w > 65 && (
                    <text
                      x={x + 8}
                      y={y + rowHeight / 2 + 4}
                      fontSize={10}
                      fontWeight={700}
                      fill="white"
                      fontFamily="var(--font-sans), sans-serif"
                      style={{ pointerEvents: "none" }}
                    >
                      {bar.name.length > Math.floor(w / 7)
                        ? bar.name.slice(0, Math.floor(w / 7) - 1) + "…"
                        : bar.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Today line */}
            <line
              x1={todayX}
              y1={0}
              x2={todayX}
              y2={svgHeight + 40}
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
            <text
              x={todayX + 4}
              y={14}
              fontSize={10}
              fontWeight={700}
              fill="var(--accent)"
            >
              Today
            </text>

            {/* Sticky Left Column Overlay */}
            <g id="sticky-left-col" transform={`translate(${scrollLeft}, 0)`}>
              {/* White background overlay to block horizontal elements underneath */}
              <rect x={0} y={0} width={labelWidth} height={svgHeight + 40} fill="#ffffff" />
              
              {/* Header block */}
              <rect x={0} y={0} width={labelWidth} height={40} fill="#f8fafc" />
              <line x1={0} y1={39} x2={labelWidth} y2={39} stroke="#e2e8f0" strokeWidth={1} />
              <text
                x={12}
                y={24}
                fontSize={10}
                fontWeight={700}
                fill="#475569"
                fontFamily="Plus Jakarta Sans, sans-serif"
                letterSpacing="0.5px"
              >
                TASKS & TIMELINE
              </text>

              {/* Sticky rows mapping label text */}
              {rows.map((row, i) => {
                const y = 40 + i * rowHeight;
                if (row.type === "header") {
                  const color = PHASE_GANTT_COLORS[row.phaseIndex] || "#64748b";
                  return (
                    <g key={`sticky-header-${i}`}>
                      <rect
                        x={0}
                        y={y}
                        width={labelWidth}
                        height={rowHeight}
                        fill={color}
                        fillOpacity={0.1}
                      />
                      <text
                        x={12}
                        y={y + rowHeight / 2 + 4}
                        fontSize={11}
                        fontWeight={750}
                        fill={color}
                        fontFamily="Plus Jakarta Sans, sans-serif"
                        letterSpacing="0.2px"
                      >
                        {row.phaseName.toUpperCase()}
                      </text>
                      {/* Plus button to add task */}
                      <g
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickAdd(row.phaseId);
                        }}
                      >
                        <circle cx={labelWidth - 24} cy={y + rowHeight / 2} r={8} fill={color} fillOpacity={0.15} />
                        <path
                          d={`M${labelWidth - 24} ${y + rowHeight / 2 - 4} L${labelWidth - 24} ${y + rowHeight / 2 + 4} M${labelWidth - 28} ${y + rowHeight / 2} L${labelWidth - 20} ${y + rowHeight / 2}`}
                          stroke={color}
                          strokeWidth={1.5}
                        />
                      </g>
                      <line
                        x1={0}
                        y1={y + rowHeight}
                        x2={labelWidth}
                        y2={y + rowHeight}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                      />
                    </g>
                  );
                }
                const { bar } = row;
                const isDone = bar.status === "DONE";

                return (
                  <g key={`sticky-label-${bar.id}`}>
                    <rect x={0} y={y} width={labelWidth} height={rowHeight} fill="#ffffff" />
                    <text
                      x={bar.isSubtask ? 28 : 16}
                      y={y + rowHeight / 2 + 4}
                      fontSize={12}
                      fontWeight={bar.isSubtask ? 500 : 600}
                      fill={isDone ? "#94a3b8" : "#0f172a"}
                      fontFamily="Inter, sans-serif"
                      textDecoration={isDone ? "line-through" : undefined}
                    >
                      {bar.name.length > 26 ? bar.name.slice(0, 25) + "…" : bar.name}
                    </text>
                    <line
                      x1={0}
                      y1={y + rowHeight}
                      x2={labelWidth}
                      y2={y + rowHeight}
                      stroke="#e2e8f0"
                      strokeWidth={0.5}
                      strokeOpacity={0.4}
                    />
                  </g>
                );
              })}

              {/* Vertical boundary separator line */}
              <line
                x1={labelWidth}
                y1={0}
                x2={labelWidth}
                y2={svgHeight + 40}
                stroke="#e2e8f0"
                strokeWidth={1.5}
              />
            </g>
          </svg>

          {/* Glassmorphic Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none fixed z-[300] min-w-[200px] rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md p-4 text-xs shadow-xl"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                color: "var(--text-primary)",
              }}
            >
              <p className="font-bold text-slate-800 mb-1">{tooltip.bar.name}</p>
              <p className="font-semibold text-slate-400 text-[10px] mb-2 uppercase tracking-wide">{tooltip.bar.phaseName}</p>
              
              <div className="space-y-1 text-slate-500 font-medium">
                {tooltip.bar.assigneeText && (
                  <p>
                    <span className="font-bold text-slate-400">Owner:</span> {tooltip.bar.assigneeText}
                  </p>
                )}
                <p>
                  <span className="font-bold text-slate-400">Dates:</span> {formatAUDate(tooltip.bar.start)} → {formatAUDate(tooltip.bar.end)}
                </p>
                {tooltip.bar.duration && (
                  <p>
                    <span className="font-bold text-slate-400">Duration:</span> {formatDuration(tooltip.bar.duration)} ({tooltip.bar.duration} bd)
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                    tooltip.bar.status === "BLOCKED"
                      ? "bg-red-50 text-red-600"
                      : tooltip.bar.status === "DONE"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {tooltip.bar.status.replace("_", " ")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Add Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Quick Add Task">
        <form onSubmit={handleQuickAddSubmit} className="space-y-4 pt-2">
          <Input
            label="Task Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            placeholder="e.g. Draft structural plans"
            disabled={isSubmitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              type="date"
              label="Due Date"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              options={[
                { value: "LOW", label: "Low" },
                { value: "NORMAL", label: "Normal" },
                { value: "HIGH", label: "High" },
                { value: "URGENT", label: "Urgent" },
              ]}
              disabled={isSubmitting}
            />
            <Select
              label="Assignee"
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              options={[
                { value: "", label: "No Assignee" },
                ...project.contacts.map((c) => ({ value: c.id, label: c.name })),
              ]}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MonthHeader({
  days,
  colWidth,
  labelWidth,
  zoom,
}: {
  days: Date[];
  colWidth: number;
  labelWidth: number;
  zoom: ZoomLevel;
}) {
  // Group consecutive days by month
  const months: { label: string; x: number; width: number }[] = [];
  let currentMonth = -1;
  let currentX = labelWidth;
  let currentWidth = 0;
  let currentLabel = "";

  days.forEach((day, i) => {
    const m = day.getMonth();
    if (m !== currentMonth) {
      if (currentWidth > 0) {
        months.push({ label: currentLabel, x: currentX, width: currentWidth });
      }
      currentMonth = m;
      currentX = labelWidth + i * colWidth;
      currentWidth = colWidth;
      currentLabel = day.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
    } else {
      currentWidth += colWidth;
    }
  });
  if (currentWidth > 0) {
    months.push({ label: currentLabel, x: currentX, width: currentWidth });
  }

  return (
    <g>
      {/* Month bands */}
      {months.map((m, i) => (
        <g key={i}>
          <rect x={m.x} y={0} width={m.width} height={22} fill={i % 2 === 0 ? "var(--bg-muted)" : "var(--bg-surface)"} />
          <text
            x={m.x + 8}
            y={15}
            fontSize={10}
            fontWeight={750}
            fill="var(--text-secondary)"
            fontFamily="var(--font-display), sans-serif"
            letterSpacing="0.2px"
          >
            {m.label.toUpperCase()}
          </text>
          <line x1={m.x} y1={0} x2={m.x} y2={40} stroke="var(--border)" strokeWidth={1} />
        </g>
      ))}

      {/* Sub-header row for Days or Weeks */}
      {zoom === "day" && days.map((day, i) => {
        const x = labelWidth + i * colWidth;
        const dayLabel = day.toLocaleDateString("en-AU", { weekday: "short" });
        const dayNum = day.getDate();
        const isToday = day.toDateString() === new Date().toDateString();
        return (
          <g key={i}>
            <rect x={x} y={22} width={colWidth} height={18} fill={isToday ? "rgba(59,130,246,0.05)" : "transparent"} />
            <text
              x={x + colWidth / 2}
              y={34}
              fontSize={8}
              fontWeight={isToday ? 800 : 600}
              fill={isToday ? "var(--accent)" : "var(--text-tertiary)"}
              textAnchor="middle"
              fontFamily="var(--font-sans), sans-serif"
            >
              {dayLabel} {dayNum}
            </text>
          </g>
        );
      })}

      {zoom === "week" && days.map((day, i) => {
        const x = labelWidth + i * colWidth;
        const dayLabel = day.toLocaleDateString("en-AU", { weekday: "narrow" });
        const dayNum = day.getDate();
        const isToday = day.toDateString() === new Date().toDateString();
        return (
          <g key={i}>
            <rect x={x} y={22} width={colWidth} height={18} fill={isToday ? "rgba(59,130,246,0.05)" : "transparent"} />
            <text
              x={x + colWidth / 2}
              y={34}
              fontSize={8}
              fontWeight={isToday ? 800 : 600}
              fill={isToday ? "var(--accent)" : "var(--text-tertiary)"}
              textAnchor="middle"
              fontFamily="var(--font-sans), sans-serif"
            >
              {dayLabel}{dayNum}
            </text>
          </g>
        );
      })}

      {zoom === "month" && days.map((day, i) => {
        if (day.getDay() !== 1) return null;
        const x = labelWidth + i * colWidth;
        const dayNum = day.getDate();
        return (
          <g key={i}>
            <text
              x={x + colWidth / 2}
              y={34}
              fontSize={8}
              fontWeight={700}
              fill="var(--text-tertiary)"
              textAnchor="middle"
              fontFamily="var(--font-sans), sans-serif"
            >
              {dayNum}
            </text>
          </g>
        );
      })}

      {zoom === "quarter" && days.map((day, i) => {
        if (day.getDay() !== 1) return null;
        const x = labelWidth + i * colWidth;
        const label = day.toLocaleDateString("en-AU", { day: "numeric", month: "numeric" });
        if (i % 2 !== 0) return null;
        return (
          <g key={i}>
            <text
              x={x + colWidth / 2}
              y={34}
              fontSize={7.5}
              fontWeight={600}
              fill="var(--text-tertiary)"
              textAnchor="middle"
              fontFamily="var(--font-sans), sans-serif"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Bottom border line */}
      <line x1={labelWidth} y1={39} x2={labelWidth + days.length * colWidth} y2={39} stroke="var(--border)" strokeWidth={1} />
    </g>
  );
}
