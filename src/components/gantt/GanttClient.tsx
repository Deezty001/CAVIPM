"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
  const rowHeight = 32;
  const labelWidth = 220;

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
  // Today line X
  const todayX = dayToX(today);

  // Group bars by phase for section headers
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
    <div className="app-page">
      {/* Header */}
      <Link
        href={`/projects/${project.id}`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-[#6b6b6b] transition-colors hover:text-[#111111]"
      >
        <ChevronLeft className="w-4 h-4" />
        {project.name}
      </Link>

      <div className="mb-6 flex items-end justify-between gap-4">
        <h1
          className="page-title"
        >
          Gantt Chart
        </h1>
        <div
          className="flex rounded-full bg-[#eaeae8] p-1 text-[13px]"
        >
          {(["week", "month", "quarter"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className="rounded-full px-4 py-2 capitalize transition-colors"
              style={{
                background: zoom === z ? "var(--bg-dark)" : "transparent",
                color: zoom === z ? "white" : "var(--text-secondary)",
              }}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {bars.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No tasks with start and due dates yet. Add dates to tasks to see them here.
          </p>
        </div>
      ) : (
        <div
          className="surface-card overflow-auto"
          style={{
            maxHeight: "calc(100vh - 200px)",
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
                      ? "rgba(74,111,165,0.06)"
                      : isWeekend
                      ? "rgba(0,0,0,0.025)"
                      : isHoliday
                      ? "rgba(245,158,11,0.06)"
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
                      fill={`${color}18`}
                    />
                    <text
                      x={8}
                      y={y + rowHeight / 2 + 5}
                      fontSize={11}
                      fontWeight={600}
                      fill={color}
                      fontFamily="Syne, sans-serif"
                    >
                      {row.phaseName}
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
                  {/* Row hover bg */}
                  <rect
                    x={0}
                    y={y}
                    width={totalWidth}
                    height={rowHeight}
                    fill="transparent"
                  />
                  {/* Label */}
                  <text
                    x={bar.isSubtask ? 16 : 8}
                    y={y + rowHeight / 2 + 4}
                    fontSize={11}
                    fill={isDone ? "#9ca3af" : "var(--text-secondary)"}
                    fontFamily="DM Sans, sans-serif"
                    textDecoration={isDone ? "line-through" : undefined}
                  >
                    {bar.name.length > 28 ? bar.name.slice(0, 27) + "…" : bar.name}
                  </text>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y + (bar.isSubtask ? 10 : 8)}
                    width={Math.max(w, 4)}
                    height={bar.isSubtask ? rowHeight - 20 : rowHeight - 16}
                    rx={3}
                    fill={isDone ? "#d1d5db" : color}
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
                  {w > 60 && (
                    <text
                      x={x + 6}
                      y={y + rowHeight / 2 + 4}
                      fontSize={10}
                      fill="white"
                      fontFamily="DM Sans, sans-serif"
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
              strokeDasharray="4,3"
            />
            <text
              x={todayX + 3}
              y={14}
              fontSize={10}
              fill="var(--accent)"
              fontWeight={600}
            >
              Today
            </text>
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none fixed z-[300] min-w-[180px] rounded-[10px] border border-[#ebebeb] bg-white p-3 text-xs shadow-[var(--shadow-raised)]"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                color: "var(--text-primary)",
              }}
            >
              <p className="font-semibold mb-1">{tooltip.bar.name}</p>
              <p style={{ color: "var(--text-muted)" }}>{tooltip.bar.phaseName}</p>
              {tooltip.bar.assigneeText && (
                <p style={{ color: "var(--text-muted)" }}>
                  Assignee: {tooltip.bar.assigneeText}
                </p>
              )}
              <p style={{ color: "var(--text-muted)" }}>
                {formatAUDate(tooltip.bar.start)} → {formatAUDate(tooltip.bar.end)}
              </p>
              {tooltip.bar.duration && (
                <p style={{ color: "var(--text-muted)" }}>
                  {formatDuration(tooltip.bar.duration)} ({tooltip.bar.duration} bd)
                </p>
              )}
              <p
                className={`font-medium mt-1 ${
                  tooltip.bar.status === "BLOCKED"
                    ? "text-red-500"
                    : tooltip.bar.status === "DONE"
                    ? "text-emerald-600"
                    : ""
                }`}
              >
                {tooltip.bar.status.replace("_", " ")}
              </p>
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
            x={m.x + 6}
            y={24}
            fontSize={11}
            fontWeight={600}
            fill="var(--text-secondary)"
            fontFamily="Syne, sans-serif"
          >
            {m.label}
          </text>
          <line x1={m.x} y1={0} x2={m.x} y2={40} stroke="var(--border)" strokeWidth={1} />
        </g>
      ))}

      {/* Bottom border */}
      <line x1={0} y1={39} x2={labelWidth + days.length * colWidth} y2={39} stroke="var(--border)" strokeWidth={1} />
    </g>
  );
}
