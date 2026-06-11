"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, BarChart3 } from "lucide-react";
import { PHASE_NAMES, PHASE_GANTT_COLORS } from "@/lib/utils";
import { isBusinessDay } from "@/lib/holidays";
import { formatAUDate, formatDuration } from "@/lib/dates";

type Project = NonNullable<Awaited<ReturnType<typeof import("@/actions/projects").getProject>>>;
type ZoomLevel = "week" | "month" | "quarter";

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

interface GanttBarInfo {
  id: string;
  name: string;
  start: Date;
  end: Date;
  status: string;
  priority: string;
  phaseIndex: number;
  phaseName: string;
  assigneeText: string | null;
  duration: number | null;
  isSubtask: boolean;
}

export function GanttClient({ project }: { project: Project }) {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [tooltip, setTooltip] = useState<{ bar: GanttBarInfo; x: number; y: number } | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collect all bars
  const bars: GanttBarInfo[] = [];
  for (const phase of project.phases.sort((a, b) => a.order - b.order)) {
    const phaseIndex = phase.order;
    for (const task of phase.tasks.sort((a, b) => a.order - b.order)) {
      if (task.startDate && task.dueDate) {
        bars.push({
          id: task.id,
          name: task.name,
          start: new Date(task.startDate),
          end: new Date(task.dueDate),
          status: task.status,
          priority: task.priority,
          phaseIndex,
          phaseName: phase.name,
          assigneeText: task.assigneeText ?? task.assignee?.name ?? null,
          duration: task.duration,
          isSubtask: false,
        });
      }
      for (const sub of task.subtasks) {
        if (sub.startDate && sub.dueDate) {
          bars.push({
            id: sub.id,
            name: sub.name,
            start: new Date(sub.startDate),
            end: new Date(sub.dueDate),
            status: sub.status,
            priority: sub.priority,
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

  const colWidth = zoom === "week" ? 40 : zoom === "month" ? 24 : 14;
  const rowHeight = 36;
  const labelWidth = 240;

  function dayToX(date: Date): number {
    const diff = Math.floor((date.getTime() - rangeStart.getTime()) / 86400000);
    return labelWidth + diff * colWidth;
  }

  function barStyle(bar: GanttBarInfo) {
    const x = dayToX(bar.start);
    const w = Math.max(
      colWidth,
      Math.floor((bar.end.getTime() - bar.start.getTime()) / 86400000) * colWidth + colWidth
    );
    return { x, w };
  }

  const totalWidth = labelWidth + allRangeDays.length * colWidth;
  const todayX = dayToX(today);

  // Group bars by phase
  const phaseGroups: { phaseIndex: number; phaseName: string; bars: GanttBarInfo[] }[] = [];
  for (const phaseName of PHASE_NAMES) {
    const phaseIndex = PHASE_NAMES.indexOf(phaseName);
    const phaseBars = bars.filter((b) => b.phaseIndex === phaseIndex);
    if (phaseBars.length > 0) {
      phaseGroups.push({ phaseIndex, phaseName, bars: phaseBars });
    }
  }

  // Flatten with section headers
  type Row = { type: "header"; phaseName: string; phaseIndex: number } | { type: "bar"; bar: GanttBarInfo };
  const rows: Row[] = [];
  for (const group of phaseGroups) {
    rows.push({ type: "header", phaseName: group.phaseName, phaseIndex: group.phaseIndex });
    for (const bar of group.bars) {
      rows.push({ type: "bar", bar });
    }
  }

  const svgHeight = rows.length * rowHeight + 40;

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

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display sm:text-4xl">
            Gantt Timeline
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Schedule visualization
          </p>
        </div>

        {/* Apple Segmented control zoom filters */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1.5 border border-slate-200/40">
          {(["week", "month", "quarter"] as ZoomLevel[]).map((z) => (
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
          className="surface-card overflow-auto border border-slate-100 rounded-2xl bg-white shadow-sm scrollbar-thin"
          style={{
            maxHeight: "calc(100vh - 220px)",
          }}
        >
          <svg
            width={totalWidth}
            height={svgHeight + 40}
            style={{ display: "block", minWidth: "100%" }}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Date header — months */}
            <MonthHeader
              days={allRangeDays}
              colWidth={colWidth}
              labelWidth={labelWidth}
            />

            {/* Column backgrounds */}
            {allRangeDays.map((day, i) => {
              const x = labelWidth + i * colWidth;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isHoliday = !isWeekend && !isBusinessDay(day);
              const isToday = day.toDateString() === today.toDateString();
              return (
                <rect
                  key={i}
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
              );
            })}

            {/* Row backgrounds + labels */}
            {rows.map((row, i) => {
              const y = 40 + i * rowHeight;
              if (row.type === "header") {
                const color = PHASE_GANTT_COLORS[row.phaseIndex];
                return (
                  <g key={`header-${i}`}>
                    <rect
                      x={0}
                      y={y}
                      width={totalWidth}
                      height={rowHeight}
                      fill={`${color}10`}
                    />
                    <text
                      x={12}
                      y={y + rowHeight / 2 + 4}
                      fontSize={11}
                      fontWeight={750}
                      fill={color}
                      fontFamily="var(--font-display), sans-serif"
                      letterSpacing="0.2px"
                    >
                      {row.phaseName.toUpperCase()}
                    </text>
                  </g>
                );
              }
              const { bar } = row;
              const { x, w } = barStyle(bar);
              const color = PHASE_GANTT_COLORS[bar.phaseIndex];
              const isDone = bar.status === "DONE";
              const isBlocked = bar.status === "BLOCKED";

              return (
                <g key={`bar-${bar.id}`}>
                  {/* Row hover bg placeholder */}
                  <rect
                    x={0}
                    y={y}
                    width={totalWidth}
                    height={rowHeight}
                    fill="transparent"
                  />
                  {/* Label */}
                  <text
                    x={bar.isSubtask ? 28 : 16}
                    y={y + rowHeight / 2 + 4}
                    fontSize={12}
                    fontWeight={bar.isSubtask ? 500 : 600}
                    fill={isDone ? "#94a3b8" : "var(--text-primary)"}
                    fontFamily="var(--font-sans), sans-serif"
                    textDecoration={isDone ? "line-through" : undefined}
                  >
                    {bar.name.length > 26 ? bar.name.slice(0, 25) + "…" : bar.name}
                  </text>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y + (bar.isSubtask ? 10 : 8)}
                    width={Math.max(w, 5)}
                    height={bar.isSubtask ? rowHeight - 20 : rowHeight - 16}
                    rx={5}
                    fill={isDone ? "#cbd5e1" : color}
                    fillOpacity={isDone ? 1 : 0.85}
                    stroke={isBlocked ? "#ef4444" : "transparent"}
                    strokeWidth={isBlocked ? 2 : 0}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      setTooltip({
                        bar,
                        x: e.clientX + 12,
                        y: e.clientY - 10,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {/* Bar label */}
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
    </div>
  );
}

function MonthHeader({
  days,
  colWidth,
  labelWidth,
}: {
  days: Date[];
  colWidth: number;
  labelWidth: number;
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
      {/* Label column header */}
      <rect x={0} y={0} width={labelWidth} height={40} fill="var(--bg-muted)" />
      <rect x={0} y={38} width={labelWidth} height={2} fill="var(--border)" />

      {/* Month bands */}
      {months.map((m, i) => (
        <g key={i}>
          <rect x={m.x} y={0} width={m.width} height={40} fill={i % 2 === 0 ? "var(--bg-muted)" : "var(--bg-surface)"} />
          <text
            x={m.x + 8}
            y={24}
            fontSize={11}
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

      {/* Bottom border */}
      <line x1={0} y1={39} x2={labelWidth + days.length * colWidth} y2={39} stroke="var(--border)" strokeWidth={1} />
    </g>
  );
}
